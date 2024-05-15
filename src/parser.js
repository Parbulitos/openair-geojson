"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function convertDMSToDecimal(dms) {
    const [coordinate, direction] = dms.split(/\s+/);
    const [degrees, minutes, seconds] = coordinate
        .split(":")
        .map((part) => parseFloat(part));
    let decimal = degrees + minutes / 60 + seconds / 3600;
    if (direction === "S" || direction === "W") {
        decimal *= -1;
    }
    return decimal;
}
function toRadians(degrees) {
    return (degrees * Math.PI) / 180;
}
function toDegrees(radians) {
    return (radians * 180) / Math.PI;
}
function parseFile(text) {
    const airspaces = [];
    const lines = text.split("\n");
    let currentAirspace = null;
    let parsedPoints = [];
    let currentSP = null;
    let currentDP = null;
    let currentV = null;
    for (const line of lines) {
        if (line.startsWith("*##")) {
            //Check if there is an airspace that needs to be saved
            if (currentAirspace) {
                //Resaving the first point as the last to close GeoJson
                if (currentSP)
                    currentAirspace.SP = currentSP;
                parsedPoints.push(parsedPoints[0]);
                currentAirspace.points = parsedPoints;
                //Saving the parsed airspace
                airspaces.push(currentAirspace);
                //Reset of local variables
                parsedPoints = [];
            }
            const airspaceNameMatch = line.match(/\*##\s*(.*?)\s*###/);
            const airspaceName = airspaceNameMatch ? airspaceNameMatch[1] : "";
            currentAirspace = { airspaceName: airspaceName };
        }
        else if (line.startsWith("AN")) {
            const identifierMatch = line.match(/AN (.+)$/);
            if (identifierMatch && currentAirspace) {
                currentAirspace.AN = identifierMatch[1].trim();
            }
        }
        else if (line.startsWith("AC")) {
            const airspaceTypeMatch = line.match(/AC (.+)$/);
            if (airspaceTypeMatch && currentAirspace) {
                currentAirspace.AC = airspaceTypeMatch[1].trim();
            }
        }
        else if (line.startsWith("AH")) {
            const maxAltitudeMatch = line.match(/AH (.+)$/);
            if (maxAltitudeMatch && currentAirspace) {
                currentAirspace.AH = maxAltitudeMatch[1].trim();
            }
        }
        else if (line.startsWith("V")) {
            if (!currentV) {
                currentV = {};
            }
            const letter = line.match(/(?<=\s)[A-Z](?==)/g);
            if (letter) {
                if (letter[0] === "D") {
                    const DMatch = line.match(/[+-]/g);
                    if (DMatch && currentAirspace) {
                        currentV.D = DMatch[0];
                    }
                }
                else if (letter[0] === "X") {
                    const XMatch = line.match(/\d+:\d+:\d+\s+[NSEW]/g);
                    if (XMatch && currentAirspace) {
                        currentV.X = {
                            lon: convertDMSToDecimal(XMatch[1]),
                            lat: convertDMSToDecimal(XMatch[0]),
                        };
                    }
                }
                else if (letter[0] === "W") {
                    const WMatch = line.match(/\d+/g);
                    if (WMatch && currentAirspace) {
                        currentV = { W: parseInt(WMatch[0]) };
                    }
                }
            }
        }
        else if (line.startsWith("DA")) {
            const DAMatch = line.match(/\d+(\.\d+)?/g);
            if (currentAirspace && DAMatch && currentV) {
                const newDA = {
                    radius: DAMatch[0],
                    angleStart: DAMatch[1],
                    angleEnd: DAMatch[2],
                };
                currentV.DA = newDA;
                parsedPoints.push({ V: currentV });
                currentV = null;
            }
        }
        else if (line.startsWith("DB")) {
            const DBMatch = line.match(/(\d+:\d+:\d+\s+[NSEW])/g);
            if (currentAirspace && DBMatch && currentV) {
                currentV.DB = {
                    latOrg: convertDMSToDecimal(DBMatch[0]),
                    lonOrg: convertDMSToDecimal(DBMatch[1]),
                    latDest: convertDMSToDecimal(DBMatch[2]),
                    lonDest: convertDMSToDecimal(DBMatch[3]),
                };
                parsedPoints.push({ V: currentV });
                currentV = null;
            }
        }
        else if (line.startsWith("DC")) {
            const DCMatch = line.match(/\d+.\d+/g);
            if (currentAirspace && DCMatch && currentV) {
                currentV.DC = DCMatch[0];
                parsedPoints.push({ V: currentV });
            }
        }
        else if (line.startsWith("DP")) {
            const latitudeDMS = line.match(/\d+:\d+:\d+\s+[NS]/g);
            const longitudeDMS = line.match(/\d+:\d+:\d+\s+[EW]/g);
            if (latitudeDMS && longitudeDMS) {
                currentDP = {
                    lon: convertDMSToDecimal(longitudeDMS[0]),
                    lat: convertDMSToDecimal(latitudeDMS[0]),
                };
                parsedPoints.push({ DP: currentDP });
            }
        }
        else if (line.startsWith("SP")) {
            const spMatch = line.match(/(\d+)/g);
            if (spMatch) {
                const style = parseInt(spMatch[0]);
                const width = parseInt(spMatch[1]);
                const red = parseInt(spMatch[2]);
                const green = parseInt(spMatch[3]);
                const blue = parseInt(spMatch[4]);
                currentSP = { style, width, red, green, blue };
            }
        }
    }
    if (currentAirspace) {
        //Resaving the first point as the last to close GeoJson
        parsedPoints.push(parsedPoints[0]);
        currentAirspace.points = parsedPoints;
        airspaces.push(currentAirspace);
    }
    return airspaces;
}
function calculateDestination(lon1, lat1, distance, bearing) {
    const phi1 = toRadians(lat1);
    const lambda1 = toRadians(lon1);
    const theta = toRadians(bearing);
    const angularDistance = distance / 6371e3;
    const phi2 = Math.asin(Math.sin(phi1) * Math.cos(angularDistance) +
        Math.cos(phi1) * Math.sin(angularDistance) * Math.cos(theta));
    const lambda2 = lambda1 +
        Math.atan2(Math.sin(theta) * Math.sin(angularDistance) * Math.cos(phi1), Math.cos(angularDistance) - Math.sin(phi1) * Math.sin(phi2));
    return {
        lon: toDegrees(lambda2),
        lat: toDegrees(phi2),
    };
}
function calculateBearing(lon1, lat1, lon2, lat2) {
    const phi1 = toRadians(lat1);
    const phi2 = toRadians(lat2);
    const deltaLambda = toRadians(lon2 - lon1);
    const y = Math.sin(deltaLambda) * Math.cos(phi2);
    const x = Math.cos(phi1) * Math.sin(phi2) -
        Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);
    const theta = Math.atan2(y, x);
    return ((theta * 180) / Math.PI + 360) % 360; // Convertir de nuevo a grados y normalizar
}
function calculateStraightLineDistance(point1, point2) {
    const earthRadiusKm = 6371; // Radio medio de la Tierra en kilómetros
    const lat1 = toRadians(point1.lat);
    const lat2 = toRadians(point2.lat);
    const deltaLat = toRadians(point2.lat - point1.lat);
    const deltaLon = toRadians(point2.lon - point1.lon);
    // Fórmula de la distancia euclidiana en un sistema de coordenadas planas
    const distance = earthRadiusKm *
        Math.sqrt(Math.pow(deltaLat, 2) +
            Math.pow(Math.cos((lat1 + lat2) / 2) * deltaLon, 2));
    // Convertir la distancia de kilómetros a metros
    return distance * 1000;
}
function getArcPoints(center, orgPoint, destPoint, clockWise, steps) {
    const arcPoints = [];
    const orgBearing = calculateBearing(center.lon, center.lat, orgPoint.lon, orgPoint.lat);
    const destBearing = calculateBearing(center.lon, center.lat, destPoint.lon, destPoint.lat);
    const deg = clockWise
        ? (destBearing - orgBearing + 360) % 360
        : (orgBearing - destBearing + 360) % 360;
    const stepDeg = deg / steps;
    const distance = calculateStraightLineDistance(center, orgPoint);
    if (clockWise) {
        for (let i = 0; i <= steps; i++) {
            let currentBearing = (orgBearing + stepDeg * i) % 360;
            let nextPoint = calculateDestination(center.lon, center.lat, distance, currentBearing);
            //let point = [nextPoint.lon, nextPoint.lat];
            arcPoints.push(nextPoint);
        }
    }
    else {
        for (let i = 0; i <= steps; i++) {
            let currentBearing = (orgBearing - stepDeg * i) % 360;
            let nextPoint = calculateDestination(center.lon, center.lat, distance, currentBearing);
            let point = [nextPoint.lon, nextPoint.lat];
            arcPoints.push(nextPoint);
        }
    }
    return arcPoints;
}
function getCirclePoints(center, radius, steps) {
    const circlePoints = [];
    const startingPoint = calculateDestination(center.lon, center.lat, radius * 1850, 0);
    const stepDeg = 360 / steps;
    for (let i = 0; i <= steps; i++) {
        let currentBearing = stepDeg * i;
        let nextPoint = calculateDestination(center.lon, center.lat, radius * 1850, currentBearing);
        circlePoints.push(nextPoint);
    }
    return circlePoints;
}
function createGeoJSONFromAirspaces(airspaces) {
    airspaces.forEach((airspace) => {
        var _a;
        const parsedCoordinates = [];
        let closingPointDA = null;
        if (airspace.points && airspace.points.length > 0) {
            const closingPoint = airspace.points.pop();
            (_a = airspace.points) === null || _a === void 0 ? void 0 : _a.forEach((point) => {
                //Simple point
                if (point.DP) {
                    parsedCoordinates.push(point.DP);
                }
                //Arch or circle points
                else if (point.V) {
                    //Case DA
                    if (point.V.DA) {
                        const center = point.V.X;
                        if (center) {
                            const org = calculateDestination(center === null || center === void 0 ? void 0 : center.lon, center === null || center === void 0 ? void 0 : center.lat, parseInt(point.V.DA.radius) * 1850, parseInt(point.V.DA.angleStart));
                            if (!closingPointDA) {
                                closingPointDA = org;
                            }
                            const dest = calculateDestination(center === null || center === void 0 ? void 0 : center.lon, center === null || center === void 0 ? void 0 : center.lat, parseInt(point.V.DA.radius) * 1850, parseInt(point.V.DA.angleEnd));
                            const archPoints = getArcPoints(center, { lon: org.lon, lat: org.lat }, { lon: dest.lon, lat: dest.lat }, point.V.D === "+", 30);
                            archPoints.forEach((point) => {
                                parsedCoordinates.push(point);
                            });
                        }
                    }
                    //Case DB
                    if (point.V.DB && point.V.X) {
                        parsedCoordinates.push({
                            lon: point.V.DB.lonOrg,
                            lat: point.V.DB.latOrg,
                        });
                        const archPoints = getArcPoints(point.V.X, { lon: point.V.DB.lonOrg, lat: point.V.DB.latOrg }, { lon: point.V.DB.lonDest, lat: point.V.DB.latDest }, point.V.D === "+", 30);
                        archPoints.forEach((point) => {
                            parsedCoordinates.push(point);
                        });
                    }
                    //Case DC
                    if (point.V.DC && point.V.X) {
                        const circlePoints = getCirclePoints({ lon: point.V.X.lon, lat: point.V.X.lat }, parseInt(point.V.DC), 50);
                        circlePoints.forEach((point) => {
                            parsedCoordinates.push(point);
                        });
                    }
                }
            });
        }
        parsedCoordinates.push(parsedCoordinates[0]);
        airspace.coordinates = parsedCoordinates;
    });
    const airspacesAllowed = airspaces.filter((airspace) => {
        if (airspace.points) {
            return airspace.points.length > 0;
        }
        return false;
    });
    const airspacesGeoJson = airspacesAllowed.map((airspace, index) => {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
        if (airspace.coordinates && airspace.coordinates.length > 0) {
            return {
                type: "Feature",
                geometry: {
                    type: "Polygon",
                    coordinates: [
                        (_a = airspace.coordinates) === null || _a === void 0 ? void 0 : _a.map((coord, index) => {
                            return [coord === null || coord === void 0 ? void 0 : coord.lon, coord === null || coord === void 0 ? void 0 : coord.lat];
                        }),
                    ],
                },
                properties: {
                    name: airspace.AN,
                    opacity: 0.15,
                    label: airspace.airspaceName,
                    airspaceClass: airspace.AC,
                    labelColor: ((_b = airspace.SP) === null || _b === void 0 ? void 0 : _b.red) != undefined &&
                        ((_c = airspace.SP) === null || _c === void 0 ? void 0 : _c.green) != undefined &&
                        ((_d = airspace.SP) === null || _d === void 0 ? void 0 : _d.blue) != undefined
                        ? `rgb(${airspace.SP.red},${airspace.SP.green},${airspace.SP.blue})`
                        : "grey",
                    labelOpacity: 1,
                    fill: ((_e = airspace.SP) === null || _e === void 0 ? void 0 : _e.red) != undefined &&
                        ((_f = airspace.SP) === null || _f === void 0 ? void 0 : _f.green) != undefined &&
                        ((_g = airspace.SP) === null || _g === void 0 ? void 0 : _g.blue) != undefined
                        ? `rgb(${airspace.SP.red},${airspace.SP.green},${airspace.SP.blue})`
                        : "grey",
                    stroke: ((_h = airspace.SP) === null || _h === void 0 ? void 0 : _h.red) != undefined &&
                        ((_j = airspace.SP) === null || _j === void 0 ? void 0 : _j.green) != undefined &&
                        ((_k = airspace.SP) === null || _k === void 0 ? void 0 : _k.blue) != undefined
                        ? `rgb(${airspace.SP.red},${airspace.SP.green},${airspace.SP.blue})`
                        : "grey",
                    strokeWidth: 1,
                },
            };
        }
    });
    const resultGeoJson = {
        type: "FeatureCollection",
        features: airspacesGeoJson,
    };
    return resultGeoJson;
}
function parseToGeojson(text) {
    const airspaces = parseFile(text);
    return createGeoJSONFromAirspaces(airspaces);
}
exports.default = parseToGeojson;
