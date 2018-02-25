import KNN from './knn.js';
import {colors_16, weight_height} from './data.js';
import decolorize from './decolorize.js';

console.log("Testing height and weight");
console.log("==========================");

const solver1 = new KNN(5, weight_height.data, weight_height.labels);
console.log(solver1.predict([160, 64]));


const solver2 = new KNN(1, colors_16.data, colors_16.labels);
console.log(solver2.predict([0, 90, 0]));

console.log("Decolorizing images");
console.log("==========================");

['landscape.jpeg', 'lily.jpeg', 'waterlilies.jpeg'].forEach(filename => {
    console.log("Decolorizing " + filename + '...');
    decolorize('./files/' + filename)
        .then(() => console.log(filename + " decolorized"));
});


