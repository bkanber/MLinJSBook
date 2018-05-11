const compromise = require('compromise');
const natural = require('natural');

[
    ['plate', 'laser'],
    ['parachute', 'parasail'],
    ['parachute', 'panoply']
]
    .forEach(function(pair) {
        console.log("Levenshtein distance between '"+pair[0]+"' and '"+pair[1]+"': "
            + natural.LevenshteinDistance.apply(null, pair)
        );
    });

const tokenizablePhrase = "I've not yet seen 'THOR: RAGNAROK'; I've heard it's a great movie though. What'd you think of it?";

const simpleTokenizer = (text) =>
    text.toLowerCase()
        .replace(/(\w)'(\w)/g, '$1$2')
        .replace(/\W/g, ' ')
        .split(' ')
        .filter(token => token.length > 2);

console.log(simpleTokenizer(tokenizablePhrase));

console.log("Natural.js Word Tokenizer:");
console.log((new natural.WordTokenizer()).tokenize(tokenizablePhrase));

console.log("Natural.js WordPunct Tokenizer:");
console.log((new natural.WordPunctTokenizer()).tokenize(tokenizablePhrase));

console.log("Compromise.js Words:");
console.log(compromise(tokenizablePhrase).words().out('array'));
console.log("Compromise.js Adjectives:");
console.log(compromise(tokenizablePhrase).adjectives().out('array'));
console.log("Compromise.js Nouns:");
console.log(compromise(tokenizablePhrase).nouns().out('array'));
console.log("Compromise.js Questions:");
console.log(compromise(tokenizablePhrase).questions().out('array'));
console.log("Compromise.js Contractions:");
console.log(compromise(tokenizablePhrase).contractions().out('array'));
console.log("Compromise.js Contractions, Expanded:");
console.log(compromise(tokenizablePhrase).contractions().expand().out('array'));

console.log("Natural.js bigrams:");
console.log(natural.NGrams.bigrams(tokenizablePhrase));

console.log(natural.PorterStemmer.stem("better" ));

console.log("Tokenized and stemmed:");
console.log(
    (new natural.WordTokenizer())
        .tokenize(
            "Writing and write, lucky and luckies, part parts and parted"
        )
        .map(natural.PorterStemmer.stem)
);

console.log("Phonetics, Metaphone:");
console.log(
    (new natural.WordTokenizer())
        .tokenize("There are more things in Heaven and Earth, Horatio, than are dreamt of in your philosophy.")
        .map(natural.Metaphone.process)
);
console.log(
    (new natural.WordTokenizer())
        .tokenize("Francis Bacon and France is Bacon")
        .map(t => natural.Metaphone.process(t))
);

console.log(natural.Metaphone.compare("praise", "preys"));
console.log(natural.Metaphone.compare("praise", "frays"));

const fulltextSearch = (query, documents) => {
    const db = new natural.TfIdf();
    documents.forEach(document => db.addDocument(document));
    db.tfidfs(query, (docId, score) => {
        console.log("DocID " + docId + " has score: " + score);
    });
};

fulltextSearch("fashion style", [
    "i love cooking, it really relaxes me and makes me feel at home",
    "food and restaurants are basically my favorite things",
    "i'm not really a fashionable person",
    "that new fashion blogger has a really great style",
    "i don't love the cinematic style of that movie"
]);

const stemmedFulltextSearch = (query, documents) => {
    const db = new natural.TfIdf();
    const tokenizer = new natural.WordTokenizer();
    const stemmer = natural.PorterStemmer.stem;
    const stemAndTokenize = text => tokenizer.tokenize(text).map(token => stemmer(token));

    documents.forEach(document => db.addDocument(stemAndTokenize(document)));
    db.tfidfs(stemAndTokenize(query), (docId, score) => {
        console.log("DocID " + docId + " has score: " + score);
    });
};

stemmedFulltextSearch("fashion style", [
    "i love cooking, it really relaxes me and makes me feel at home",
    "food and restaurants are basically my favorite things",
    "i'm not really a fashionable person",
    "that new fashion blogger has a really great style",
    "i don't love the cinematic style of that movie"
]);


const summarize = (article, maxSentences = 3) => {
    const sentences = compromise(article).sentences().out('array');
    const db = new natural.TfIdf();
    const tokenizer = new natural.WordTokenizer();
    const stemmer = natural.PorterStemmer.stem;
    const stemAndTokenize = text => tokenizer.tokenize(text).map(token => stemmer(token));
    const scoresMap = {};

    // Add each sentence to the document
    sentences.forEach(sentence => db.addDocument(stemAndTokenize(sentence)));

    stemAndTokenize(article).forEach(token => {
        db.tfidfs(token, (sentenceId, score) => {
            if (!scoresMap[sentenceId]) scoresMap[sentenceId] = 0;
            scoresMap[sentenceId] += score;
        });
    });

    // Convert our scoresMap into an array so that we can easily sort it
    let scoresArray = Object.entries(scoresMap).map(item => ({score: item[1], sentenceId: item[0]}));
    // Sort the array by descending score
    scoresArray.sort((a, b) => a.score < b.score ? 1 : -1);
    // Pick the top maxSentences sentences
    scoresArray = scoresArray.slice(0, maxSentences);
    // Re-sort by ascending sentenceId
    scoresArray.sort((a, b) => parseInt(a.sentenceId) < parseInt(b.sentenceId) ? -1 : 1);
    // Return sentences
    return scoresArray
        .map(item => sentences[item.sentenceId])
        .join('. ');

};

const summarizableArticle = "One of the most popular metrics used in search relevance, text mining, and information retrieval is the term frequency - inverse document frequency score, or tf-idf for short. In essence, tf-idf measures how significant a word is to a particular document. The tf-idf metric therefore only makes sense in the context of a word in a document that's part of a larger corpus of documents. Imagine you have a corpus of documents, like blog posts on varying topics, that you want to make searchable. The end user of your application runs a search query for fashion style. How do you then find matching documents and rank them by relevance? The tf-idf score is made of two separate but related components. The first is term frequency, or the relative frequency of a specific term in a given document. If a 100-word blog post contains the word fashion four times, then the term frequency of the word fashion is 4% for that one document. Note that term frequency only requires a single term and a single document as parameters; the full corpus of documents is not required for the term frequency component of tf-idf. Term frequency by itself is not sufficient to determine relevance, however. Words like this and the appear very frequently in most text and will have high term frequencies, but those words are not typically relevant to any search.";

console.log("3-sentence summary:");
console.log(summarize(summarizableArticle, 3));
console.log("5-sentence summary:");
console.log(summarize(summarizableArticle, 5));

const siriCommand = "Hey Siri, order me a pizza from John's pizzeria";
const siriCommandObject = compromise(siriCommand);

console.log(siriCommandObject.verbs().out('array'));
console.log(siriCommandObject.nouns().out('array'));
console.log(
    compromise("Hey Siri, order me a pizza from John's pizzeria")
        .match("#Noun [#Verb me a #Noun+ *+ #Noun+]").out('text')
);

console.log(
    compromise("OK Google, write me a letter to the congressman")
        .match("#Noun [#Verb me a #Noun+ *+ #Noun+]").out('text')
);

