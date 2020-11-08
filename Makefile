data/influx_data.json: data/tracts.geojson data/tracts_centroids.geojson
	mapshaper $^ combine-files \
	-filter 'boro_name === "Manhattan"' \
	-clean \
	-each 'census_tract = "36061" + ct2010' \
	-filter-fields census_tract \
	-join data/safegraph_data.csv keys=census_tract,census_tract string-fields=census_tract \
	-sort 'aug === null? -1 : aug' \
	-target tracts_centroids \
	-filter 'aug !== null' \
	-o format=topojson target=* $@

data/tracts_centroids.geojson: data/tracts.geojson
	mapshaper $< \
	-points \
	-o $@

data/tracts.geojson:
	curl -L "https://data.cityofnewyork.us/api/geospatial/fxpq-c8ku?method=export&format=GeoJSON" -o $@