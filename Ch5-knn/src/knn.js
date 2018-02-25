/**
 * Calculate the distance between two points.
 * Points must be given as arrays or objects with equivalent keys.
 * @param {Array.<number>} a
 * @param {Array.<number>} b
 * @return {number}
 */
const distance = (a, b) => Math.sqrt(
    a.map((aPoint, i) => b[i] - aPoint)
        .reduce((sumOfSquares, diff) => sumOfSquares + (diff*diff), 0)
);

class KNN {

    constructor(k = 1, data, labels) {
        this.k = k;
        this.data = data;
        this.labels = labels;
        this.distanceMap = [];
    }

    generateDistanceMap(point) {

        const map = [];

        for (let index = 0, len = this.data.length; index < len; index++) {

            const otherPoint = this.data[index];
            const otherPointLabel = this.labels[index];
            const thisDistance = distance(point, otherPoint);

            map.push({
                index,
                distance: thisDistance,
                label: otherPointLabel
            });

        }

        map.sort((a, b) => a.distance < b.distance ? -1 : 1);

        return map;
    }

    predict(point) {

        const map = this.generateDistanceMap(point);
        const votes = map.slice(0, this.k);
        const voteCounts = votes
            // Reduces into an object like {label: voteCount}
            .reduce((obj, vote) => Object.assign({}, obj, {[vote.label]: (obj[vote.label] || 0) + 1}), {})
        ;
        const sortedVotes = Object.keys(voteCounts)
            .map(label => ({label, count: voteCounts[label]}))
            .sort((a, b) => a.count > b.count ? -1 : 1)
        ;

        return {
            label: sortedVotes[0].label,
            voteCounts,
            votes
        };

    }

}

export default KNN;