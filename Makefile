data/influx_data.json: Makefile data/tracts.geojson data/tracts_centroids.geojson
	mapshaper $(filter-out $<,$^) combine-files \
	-filter 'boro_name === "Manhattan"' \
	-clean \
	-each 'census_tract = "36061" + ct2010' \
	-filter-fields census_tract \
	-join data/2020-home_panel_change.csv keys=census_tract,census_tract string-fields=census_tract \
	-rename-fields aug20=aug,oct20=oct \
	-join data/2019-home_panel_change.csv keys=census_tract,census_tract string-fields=census_tract \
	-rename-fields aug19=aug,oct19=oct \
	-sort '+(census_tract === "36061020300")' \
	-target tracts_centroids \
	-o format=topojson target=* $@

data/tracts_centroids.geojson: data/tracts.geojson
	mapshaper $< \
	-points \
	-o $@

data/tracts.geojson:
	curl -L "https://data.cityofnewyork.us/api/geospatial/fxpq-c8ku?method=export&format=GeoJSON" -o $@