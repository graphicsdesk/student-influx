data/census_tracts.topojson: data/census_tracts.json
	mapshaper $< \
	-filter 'boro_name === "Manhattan"' \
	-clean \
	-o $@

data/census_tracts.json:
	curl -L "https://data.cityofnewyork.us/api/geospatial/fxpq-c8ku?method=export&format=GeoJSON" -o $@