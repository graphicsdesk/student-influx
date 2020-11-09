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
  const circles = pathContainer
    .selectAll('circle')
    .data(centroids.features)
    .enter()
    .append('circle')
  
  const slopes = pathContainer
    .selectAll('line')
    .data(centroids.features)
    .enter()
    .append('line')

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
    const albersprojection = geoAlbersUsa()
      .rotate([10,10,0])
      .fitSize([width, height], tracts);
    // Create the path generating function
    const pathGenerator = geoPath(albersprojection);
    // Set the `d` attribute to the path generator, which is called on the data
    // that we attached to the paths earlier
    paths.attr('d', pathGenerator);

    circles
      .attr('cx', d => albersprojection(d.geometry.coordinates)[0])
      .attr('cy', d => albersprojection(d.geometry.coordinates)[1])
      .attr('r', 2)
    
    slopes
      .attr('x1', d => albersprojection(d.geometry.coordinates)[0])
      .attr('y1', d => albersprojection(d.geometry.coordinates)[1])
      .attr('x2', d => {
        const slope = (d.properties.oct-d.properties.aug)/50
        const x = 50*Math.cos(Math.atan(slope))
        return albersprojection(d.geometry.coordinates)[0]+ x
      })
      .attr('y2', d => {
        const slope = (d.properties.oct-d.properties.aug)/50
        const y = 50*Math.sin(Math.atan(slope))
        return albersprojection(d.geometry.coordinates)[1] - y
      })
      .attr('stroke','black')
  };
}

// Call big bois

const handleResize = makeMap();
handleResize();
window.addEventListener('resize', debounce(handleResize, 400));
