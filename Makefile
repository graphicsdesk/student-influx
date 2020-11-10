data/influx_data.json: data/home_panel_change.csv data/tracts.geojson data/tracts_centroids.geojson
	mapshaper $(filter-out $<,$^) combine-files \
	-filter 'boro_name === "Manhattan"' \
	-clean \
	-each 'census_tract = "36061" + ct2010' \
	-filter-fields census_tract \
	-join $< keys=census_tract,census_tract string-fields=census_tract \
	-sort '+(census_tract === "36061020300")' \
	-info \
	-target tracts_centroids \
	-filter 'aug !== null' \
	-o format=topojson target=* $@

data/tracts_centroids.geojson: data/tracts.geojson
	mapshaper $< \
	-points \
	-o $@

data/tracts.geojson:
	curl -L "https://data.cityofnewyork.us/api/geospatial/fxpq-c8ku?method=export&format=GeoJSON" -o $@