# How to generate the world map used here

Based on https://github.com/topojson/topojson/issues/242#issuecomment-328310093

- checkout https://github.com/topojson/world-atlas
- remove geostitch
  calls: https://github.com/topojson/world-atlas/blob/a912c0a22c3fbd1979cb6defdd6389d8c35e7c2a/prepublish#L27
- run the `prepublish` script
- copy "countries" file
