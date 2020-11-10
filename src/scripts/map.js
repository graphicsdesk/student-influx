import { select } from 'd3-selection';
import { geoPath, geoAlbers } from 'd3-geo';
import { feature } from 'topojson-client';
import influxData from '../../data/influx_data.json';
import debounce from 'just-debounce';

// Set constants

const WIDTH = 960;

// Make containers

const svg = select('#map');
const pathContainer = svg.append('g');
const baselineContainer = svg.append('g');
const chartContainer = svg.append('g');
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
  const circles = chartContainer
    .selectAll('circle')
    .data(centroids.features)
    .enter()
    .append('circle');

  const slopes = chartContainer
    .selectAll('line')
    .data(centroids.features)
    .enter()
    .append('line');

  const baseline = baselineContainer
    .selectAll('line')
    .data(centroids.features)
    .enter()
    .append('line');

  const text = chartContainer
    .selectAll('text')
    .data(centroids.features)
    .enter()
    .append('text');

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
    const albersprojection = geoAlbers()
      .rotate([133, 10, 0])
      .fitSize([width, height], tracts);
    // Create the path generating function
    const pathGenerator = geoPath(albersprojection);
    // Set the `d` attribute to the path generator, which is called on the data
    // that we attached to the paths earlier
    paths.attr('d', pathGenerator);

    circles
      .attr('cx', d => albersprojection(d.geometry.coordinates)[0])
      .attr('cy', d => albersprojection(d.geometry.coordinates)[1])
      .attr('r', 3);

    slopes
      .attr('x1', d => albersprojection(d.geometry.coordinates)[0])
      .attr('y1', d => albersprojection(d.geometry.coordinates)[1])
      .attr('x2', d => {
        const slope = (d.properties.oct - d.properties.aug) / d.properties.aug;
        const x = 50 * Math.cos(Math.atan(slope));
        return albersprojection(d.geometry.coordinates)[0] + x;
      })
      .attr('y2', d => {
        const slope = (d.properties.oct - d.properties.aug) / d.properties.aug;
        const y = 50 * Math.sin(Math.atan(slope));
        return albersprojection(d.geometry.coordinates)[1] - y;
      })
      .attr('stroke', 'black')
      .attr('marker-end', 'url(#map-arrow-open)')
      .attr('stroke-width', 2);

    text
      .attr('x', d => albersprojection(d.geometry.coordinates)[0] + 5)
      .attr('y', d => albersprojection(d.geometry.coordinates)[1] + 16)
      .text(d => {
        let difference =
          (100 * (d.properties.oct - d.properties.aug)) / d.properties.aug;
        difference =
          difference < 10 ? difference.toFixed(1) : Math.round(difference);
        if (difference > 0) return '+' + difference + '%';
        else return '–' + Math.abs(difference) + '%';
      });

    baseline
      .attr('x1', d => albersprojection(d.geometry.coordinates)[0])
      .attr('y1', d => albersprojection(d.geometry.coordinates)[1])
      .attr('x2', d => albersprojection(d.geometry.coordinates)[0] + 50)
      .attr('y2', d => albersprojection(d.geometry.coordinates)[1])
      .attr('stroke', 'lightblue');
  };
}

// Call big bois

const handleResize = makeMap();
handleResize();
window.addEventListener('resize', debounce(handleResize, 400));
