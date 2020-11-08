data/census_tracts.topojson: data/census_tracts.json Makefile
	mapshaper $< \
	-filter 'boro_name === "Manhattan"' \
	-clean \
	-each 'GEOID = "36061" + ct2010' \
	-filter-fields GEOID \
	-o $@

data/census_tracts.json:
	curl -L "https://data.cityofnewyork.us/api/geospatial/fxpq-c8ku?method=export&format=GeoJSON" -o $@