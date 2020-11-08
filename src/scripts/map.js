import { select } from 'd3-selection';
import { geoPath, geoAlbersUsa } from 'd3-geo';
import { feature } from 'topojson-client';
import influxData from '../../data/influx_data.json';
import debounce from 'just-debounce';

// Set constants

const WIDTH = 960;

// Make containers

const div = select('#map-container');
const svg = div.append('svg');
const pathContainer = svg.append('g');

// Extract census tract features (contains all tracts in Manhattan)

const allTracts = feature(influxData, influxData.objects.tracts);

// Create a separate GeoJSON object that holds only the tracts we're interested
// in (useful for focusing the map in on the tracts that we actually care about)

const tracts = {
  type: 'FeatureCollection',
  features: allTracts.features.filter(d => d.properties.aug !== null),
};

// Extract census tract centroids

const centroids = feature(influxData, influxData.objects.tracts_centroids);

// Main function that draws the map

function makeMap() {
  // Create the paths that will become census tracts.
  // The `d` attribute won't be set until the resize function is called.

  const paths = pathContainer
    .selectAll('path')
    .data(allTracts.features)
    .enter()
    .append('path')
    .classed('subdue', d => d.properties.aug === null);

  // Create the things that will become the slope chart (e.g. line, arrow, circles). @char

  console.log(centroids);

  // Expose a handleResize method that handles the things that depend on
  // width (path generator, paths, and svg)

  return function handleResize() {
    // Recompute width and height
    const width = Math.min(WIDTH, document.documentElement.clientWidth - 30);
    const height = width * (19 / 30);

    // Resize the svg
    svg.attr('width', width);
    svg.attr('height', height);

    // Create the projection. Fit it to the census tracts that we care about
    const projection = geoAlbersUsa().fitSize([width, height], tracts);
    // Create the path generating function
    const pathGenerator = geoPath(projection);
    // Set the `d` attribute to the path generator, which is called on the data
    // that we attached to the paths earlier
    paths.attr('d', pathGenerator);
  };
}

// Call big bois

const handleResize = makeMap();
handleResize();
window.addEventListener('resize', debounce(handleResize, 400));
