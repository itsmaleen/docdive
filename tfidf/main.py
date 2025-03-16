import re
from nltk.corpus import stopwords


def clean_text(text):
    text = re.sub(r"```.*?```", "", text, flags=re.DOTALL)  # Remove code blocks
    text = re.sub(r"http\S+", "", text)  # Remove URLs
    text = re.sub(r"[^\w\s]", "", text)  # Remove punctuation
    text = text.lower()
    stop_words = set(stopwords.words("english"))
    return " ".join([word for word in text.split() if word not in stop_words])


from sklearn.feature_extraction.text import TfidfVectorizer

# Fetch cleaned content from your database
cleaned_docs = [clean_text(page.text_content) for page in pages]

# Calculate TF-IDF
vectorizer = TfidfVectorizer(max_features=100)
tfidf_matrix = vectorizer.fit_transform(cleaned_docs)
feature_names = vectorizer.get_feature_names_out()

# Get top terms per document
top_terms_per_doc = []
for doc in tfidf_matrix:
    top_terms = [feature_names[i] for i in doc.indices]
    top_terms_per_doc.append(top_terms[:5])  # Top 5 terms per doc


from collections import defaultdict

co_occurrence = defaultdict(int)
window_size = 3  # Words within 3 positions of each other

for doc in cleaned_docs:
    words = doc.split()
    for i in range(len(words)):
        for j in range(i + 1, min(i + window_size, len(words))):
            pair = tuple(sorted([words[i], words[j]]))
            co_occurrence[pair] += 1

# Get top co-occurring pairs
sorted_pairs = sorted(co_occurrence.items(), key=lambda x: x[1], reverse=True)[:20]

from sklearn.cluster import AgglomerativeClustering
from sklearn.metrics.pairwise import cosine_similarity

# Create term embeddings (simplified example)
term_vectors = vectorizer.transform(feature_names).toarray()
similarity_matrix = cosine_similarity(term_vectors)

# Cluster terms
clustering = AgglomerativeClustering(
    n_clusters=8, affinity="precomputed", linkage="average"
)
clusters = clustering.fit_predict(
    1 - similarity_matrix
)  # Convert similarity to distance

# Map terms to clusters
term_clusters = {}
for term, cluster in zip(feature_names, clusters):
    term_clusters.setdefault(cluster, []).append(term)
