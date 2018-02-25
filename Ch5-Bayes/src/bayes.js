
export const simpleTokenizer = string => string
    .toLowerCase()
    .replace(/[^\w\d]/g, ' ')
    .split(' ')
    .filter(word => word.length > 3)
    // This "uniques" the tokens; only responsible for 0.5% accuracy boost
    // so could be dropped if performance is an issue
    // Note; does not preserve first-occurrence order. to preserve order,
    // use .reverse() before and after the filter
    .filter((word, index, arr) => arr.indexOf(word, index+1) === -1)
;

// 3% accuracy LOSS for the IMDB dataset vs simpleTokenizer
export const bigramTokenizer = string => {
    const unigrams = simpleTokenizer(string);
    const bigrams = [];
    for (let i = 0, len = unigrams.length; i < len - 1; i++) {
        bigrams.push(unigrams[i] + " " + unigrams[i+1]);
    }
    return bigrams;
}

class BayesClassifier {

    constructor(tokenizer = null) {
        this.database = {
            labels: {},
            tokens: {}
        };

        this.tokenizer = (tokenizer !== null) ? tokenizer : simpleTokenizer;

    }


    getAllLabels() {
        return Object.keys(this.database.labels);
    }


    getLabelDocumentCount(label = null) {
        if (label) {
            return this.database.labels[label] || 0;
        } else {
            return Object.values(this.database.labels)
                .reduce((sum, count) => sum + count, 0);
        }
    }

    getTokenCount(token, label = null) {
        if (label) {
            return (this.database.tokens[token] || {})[label] || 0;
        } else {
            return Object.values(this.database.tokens[token] || {})
                .reduce((sum, count) => sum + count, 0);
        }
    }

    incrementTokenCount(token, label) {
        if (typeof this.database.tokens[token] === 'undefined') {
            this.database.tokens[token] = {};
        }

        this.database.tokens[token][label] = this.getTokenCount(token, label) + 1;
    }


    incrementLabelDocumentCount(label) {
        this.database.labels[label] = this.getLabelDocumentCount(label) + 1;
    }

    train(label, text) {
        this.incrementLabelDocumentCount(label);
        this.tokenizer(text).forEach(token => this.incrementTokenCount(token, label));
    }




    calculateTokenScore(token, label) {
        // console.log("\tInspecting token: " + token);

        const rareTokenWeight = 3;

        const totalDocumentCount = this.getLabelDocumentCount();
        const labelDocumentCount = this.getLabelDocumentCount(label);
        const notLabelDocumentCount = totalDocumentCount - labelDocumentCount;

        // Assuming equal probabilities gave us 1% accuracy bump
        // const probLabel = labelDocumentCount / totalDocumentCount;
        const probLabel = 1 / this.getAllLabels().length;
        const probNotLabel = 1 - probLabel;

        const tokenLabelCount = this.getTokenCount(token, label);
        const tokenTotalCount = this.getTokenCount(token);
        const tokenNotLabelCount = tokenTotalCount - tokenLabelCount;

        const probTokenGivenLabel = tokenLabelCount / labelDocumentCount;
        const probTokenGivenNotLabel = tokenNotLabelCount / notLabelDocumentCount;
        const probTokenLabelSupport = probTokenGivenLabel * probLabel;
        const probTokenNotLabelSupport = probTokenGivenNotLabel * probNotLabel;

        const rawWordScore =
            (probTokenLabelSupport)
            /
            (probTokenLabelSupport + probTokenNotLabelSupport);

        // console.log("\t\tRaw word score: " + rawWordScore);
        // Adjust for rare tokens -- essentially weighted average
        // We're going to shorthand some variables to make reading easier.
        // s is the "strength" or the "weight"
        // n is the number of times we've seen the token total
        const s = rareTokenWeight;
        const n = tokenTotalCount;
        const adjustedTokenScore =
            ( (s * probLabel) + (n * (rawWordScore || probLabel)) )
            /
            ( s + n );

        // console.log("\t\tAdjusted word score: " + adjustedTokenScore);


        return adjustedTokenScore;
    }

    calculateLabelProbability(label, tokens) {

        const probLabel = 1 / this.getAllLabels().length;
        // How significant each token must be in order to be considered;
        // Their score must be greater than epsilon from the default token score
        const epsilon = 0.15;

        const tokenScores = tokens
            .map(token => this.calculateTokenScore(token, label))
            // Responsible for 78% => 87.8% accuracy bump (e=.17)
            .filter(score => Math.abs(probLabel - score) > epsilon);

        const logSum = tokenScores.reduce((sum, score) => sum + (Math.log(1-score) - Math.log(score)), 0);
        const probability = 1 / (1 + Math.exp(logSum));

        return probability;
    }

    calculateAllLabelProbabilities(text) {


        const tokens = this.tokenizer(text);
        return this.getAllLabels()
            .map(label => ({
                label,
                probability: this.calculateLabelProbability(label, tokens)
            }))
            .sort((a, b) => a.probability > b.probability ? -1 : 1);

    }

    predict(text) {
        // Initialize tokens
        const probabilities = this.calculateAllLabelProbabilities(text);
        const best = probabilities[0];

        return {
            label: best.label,
            probability: best.probability,
            probabilities
        };

    }



}

export default BayesClassifier;