data/census_tracts.json: data/census_tracts.geojson Makefile
	mapshaper $< \
	-filter 'boro_name === "Manhattan"' \
	-clean \
	-each 'census_tract = "36061" + ct2010' \
	-filter-fields census_tract \
	-join data/safegraph_data.csv keys=census_tract,census_tract string-fields=census_tract \
	-o format=topojson $@

data/census_tracts.geojson:
	curl -L "https://data.cityofnewyork.us/api/geospatial/fxpq-c8ku?method=export&format=GeoJSON" -o $@