import re
from nltk.corpus import stopwords
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.cluster import AgglomerativeClustering
from sklearn.metrics.pairwise import cosine_similarity
from collections import defaultdict
from typing import List, Dict, Tuple


class TextProcessor:
    def __init__(self):
        self.stop_words = set(stopwords.words("english"))

    def clean_text(self, text: str) -> str:
        text = re.sub(r"```.*?```", "", text, flags=re.DOTALL)
        text = re.sub(
            r"http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\(\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+",
            "",
            text,
        )
        text = re.sub(r"[^\w\s]", " ", text)
        text = re.sub(r"\s+", " ", text)
        text = text.lower().strip()
        return " ".join([word for word in text.split() if word not in self.stop_words])

    def get_top_terms(
        self, documents: List[str], max_features: int, top_n: int
    ) -> List[List[str]]:
        vectorizer = TfidfVectorizer(max_features=max_features)
        tfidf_matrix = vectorizer.fit_transform(documents)
        feature_names = vectorizer.get_feature_names_out()

        top_terms_per_doc = []
        for doc in tfidf_matrix:
            top_indices = doc.toarray()[0].argsort()[-top_n:][::-1]
            top_terms = [feature_names[i] for i in top_indices]
            top_terms_per_doc.append(top_terms)
        return top_terms_per_doc

    def get_co_occurrences(
        self, documents: List[str], window_size: int, top_n: int
    ) -> List[Tuple[Tuple[str, str], int]]:
        co_occurrence = defaultdict(int)

        for doc in documents:
            words = doc.split()
            for i in range(len(words)):
                for j in range(i + 1, min(i + window_size + 1, len(words))):
                    pair = tuple(sorted([words[i], words[j]]))
                    co_occurrence[pair] += 1

        return sorted(co_occurrence.items(), key=lambda x: x[1], reverse=True)[:top_n]

    def get_term_clusters(
        self, documents: List[str], n_clusters: int
    ) -> Dict[int, List[str]]:
        vectorizer = TfidfVectorizer()
        vectorizer.fit(documents)
        feature_names = vectorizer.get_feature_names_out()
        term_vectors = vectorizer.transform(feature_names).toarray()
        similarity_matrix = cosine_similarity(term_vectors)

        clustering = AgglomerativeClustering(
            n_clusters=n_clusters, metric="precomputed", linkage="average"
        )
        clusters = clustering.fit_predict(1 - similarity_matrix)

        term_clusters = defaultdict(list)
        for term, cluster in zip(feature_names, clusters):
            term_clusters[cluster].append(term)

        return dict(term_clusters)
