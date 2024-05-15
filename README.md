openair-geojson
========

Parse Open Air description languages and generate a geojson object.

## Install
use [npm/openair-geojson](https://www.npmjs.com/package/openair-geojson):
```shell
$ npm install openair-geojson
```

## Usage

```typescript
import { parseToGeojson } from 'openair-geojson'

const geojson = parseToGeojson(fileContentToParse)

//This will show the result, manage as needed
console.log(JSON.stringify(geojson))
```

## Example
```typescript
import { parseToGeojson } from 'openair-geojson'

const fileContentToParse = '*## Castellón CTR ###
AC D
SP 0,3,255,0,255
AN Castellón CTR: LECH TWR 120.680
AH 4000ft AMSL
AL SFC
V D=+
V X=40:12:51 N  000:04:25 E
DB 40:18:51 N  000:04:11 E , 40:10:11 N  000:11:25 E
DP 40:06:07 N  000:03:12 E
DP 40:04:31 N  000:04:39 E
DP 40:04:45 N  000:06:16 W
DP 40:11:03 N  000:11:35 W
*'
const geojson = parseToGeojson(fileContentToParse)

//This will show the result, manage as needed
console.log(JSON.stringify(geojson))
```
### Result
With the example above using the Castellon CTR airspace, the geojson generated result would look like this:
```json
{
    "type": "FeatureCollection",
    "features": [
        {
            "type": "Feature",
            "geometry": {
                "type": "Polygon",
                "coordinates": [
                    [
                        [0.06972222222222223, 40.314166666666665],
                        [0.06972222222085107, 40.314166666701865],
                        [0.07874013265391293, 40.31413410202687],
                        [0.08773370503736787, 40.3136285733693],
                        [0.09666026489842769, 40.31265247953108],
                        [0.10547745993907849, 40.311210452056756],
                        [0.11414346356169053, 40.30930933296731],
                        [0.1226171757380502, 40.306958141874524],
                        [0.1308584202103104, 40.30416803264144],
                        [0.13882813703427158, 40.30095223980822],
                        [0.14648856950312228, 40.297326015053],
                        [0.1538034445230296, 40.29330655400765],
                        [0.16073814555049978, 40.288912913795656],
                        [0.16725987724487779, 40.28416592170532],
                        [0.1733378210373606, 40.2790880754544],
                        [0.17894328087005654, 40.273703435542984],
                        [0.18404981841450205, 40.268037510229135],
                        [0.18863337713820083, 40.26211713369655],
                        [0.19267239464971306, 40.25597033801486],
                        [0.19614790281712047, 40.24962621952158],
                        [0.199043615220858, 40.24311480027929],
                        [0.20134600156945248, 40.236466885283136],
                        [0.20304434877518687, 40.22971391611114],
                        [0.2041308084556671, 40.22288782172398],
                        [0.20460043069625689, 40.21602086713167],
                        [0.2044511839769798, 40.209145500650706],
                        [0.20368396123534915, 40.2022942004794],
                        [0.2023025721033426, 40.195499321317975],
                        [0.20031372142203757, 40.188792941757065],
                        [0.19772697420098054, 40.18220671315054],
                        [0.19455470725090096, 40.17577171067848],
                        [0.1908120477776721, 40.169518287292625],
                        [0.05333333333333334, 40.10194444444445],
                        [0.0775, 40.07527777777778],
                        [-0.10444444444444445, 40.07916666666667],
                        [-0.19305555555555554, 40.18416666666666],
                        [0.06972222222222223, 40.314166666666665]
                    ]
                ]
            },
            "properties": {
                "name": "Castellón CTR: LECH TWR 120.680",
                "opacity": 0.15,
                "label": "Castellón CTR",
                "airspaceClass": "D",
                "labelColor": "grey",
                "labelOpacity": 1,
                "fill": "grey",
                "stroke": "grey",
                "strokeWidth": 1
            }
        }
    ]
}
```

## license
MIT

## version

`0.1.3`
