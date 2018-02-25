import KNN from './knn.js';
import {colors_16} from './data.js';
import jimp from 'jimp';

const decolorize = filename => {

    return jimp.read(filename)
        .then(image => {

            const mapper = new KNN(1, colors_16.data, colors_16.labels);
            const {width, height} = image.bitmap;

            for (let x = 0; x < width; x++) {
                for (let y = 0; y < height; y++) {
                    const originalColorHex = image.getPixelColor(x, y);
                    const originalColorRgb = jimp.intToRGBA(originalColorHex);
                    const pixelPoint = [originalColorRgb.r, originalColorRgb.g, originalColorRgb.b];
                    const closestColor = mapper.predict(pixelPoint);
                    const newColor = colors_16.data[colors_16.labels.indexOf(closestColor.label)];
                    try {
                        const newColorHex = jimp.rgbaToInt(newColor[0], newColor[1], newColor[2], 255);
                        image.setPixelColor(newColorHex, x, y);
                    } catch (e) {
                        console.log("Got error");
                        console.log(newColor);
                        console.log(closestColor);
                    }

                }
            }

            const ext = image.getExtension();
            image.write(filename.replace('.'+ext, '') + '_16.' + ext);

        })
        .catch(err => {
            console.log("Error reading image");
            console.log(err);
        })
};

export default decolorize