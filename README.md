## Data Analysis

We used SafeGraph's home summary panel data to calculate percent change (`safegraph-analysis/`), and then joined the data with a census tract GeoJSON from NYC Open Data (`Makefile`) to produce the main, data-hydrated TopoJSON file `data/influx_data.json`.

`data/2019-home_panel_change.csv` and `data/2020-home_panel_change.csv` are necessary to create `data/influx_data.json`. The former 2 files are created with `safegraph-analysis/data-cleaning.R`. We ended up using the files for the last weeks of August and October. Those home summary files are from the Weekly Patterns product. We also tried using the files from the entire months of August and October, which are from the Monthly Patterns product.

 The code for the map visualization is in `src/scripts/map.js`.

## Development

For cloning and development instructions, see the [Spectate documentation](https://github.com/graphicsdesk/spectate/#cloning-a-spectate-project). This story was created with [Spectate](https://github.com/graphicsdesk/spectate) v1.3.3.
