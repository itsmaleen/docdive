import unittest
import grpc
import tfidf_pb2
import tfidf_pb2_grpc
from concurrent import futures
import threading
import time
from server import TFIDFServicer


class TestTFIDFServer(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Start the server in a separate thread
        cls.server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
        tfidf_pb2_grpc.add_TFIDFServiceServicer_to_server(TFIDFServicer(), cls.server)
        cls.server.add_insecure_port("[::]:50052")
        cls.server.start()

        # Create a channel to the server
        cls.channel = grpc.insecure_channel("localhost:50052")
        cls.stub = tfidf_pb2_grpc.TFIDFServiceStub(cls.channel)

    @classmethod
    def tearDownClass(cls):
        cls.channel.close()
        cls.server.stop(0)

    def test_clean_text(self):
        # Test basic text cleaning
        request = tfidf_pb2.CleanTextRequest(
            text="Hello World! This is a test with some https://links.com and ```code blocks``` @#$%"
        )
        response = self.stub.CleanText(request)
        cleaned = response.cleaned_text.lower()

        # Test URL removal
        self.assertNotIn("https", cleaned)
        self.assertNotIn("links.com", cleaned)

        # Test code block removal
        self.assertNotIn("code blocks", cleaned)

        # Test punctuation removal
        self.assertNotIn("!", cleaned)
        self.assertNotIn("@", cleaned)
        self.assertNotIn("#", cleaned)

        # Test expected words remain
        self.assertIn("hello", cleaned)
        self.assertIn("world", cleaned)
        self.assertIn("test", cleaned)

    def test_get_top_terms(self):
        # Test TF-IDF calculation and top terms extraction
        docs = [
            "machine learning is a subset of artificial intelligence",
            "deep learning uses neural networks for machine learning",
            "artificial intelligence is changing the world",
        ]
        request = tfidf_pb2.TopTermsRequest(documents=docs, max_features=10, top_n=3)
        response = self.stub.GetTopTerms(request)

        # Check we got the right number of documents back
        self.assertEqual(len(response.documents), len(docs))

        # Check each document has the right number of terms
        for doc_terms in response.documents:
            self.assertLessEqual(len(doc_terms.terms), 3)

        # Check that common ML terms are present
        all_terms = [term for doc in response.documents for term in doc.terms]
        ml_terms = {"machine", "learning", "artificial", "intelligence"}
        self.assertTrue(any(term in ml_terms for term in all_terms))

    def test_get_co_occurrences(self):
        # Test co-occurrence calculation
        docs = [
            "the quick brown fox jumps over the lazy dog",
            "the brown fox is quick and the dog is lazy",
        ]
        request = tfidf_pb2.CoOccurrenceRequest(documents=docs, window_size=2, top_n=3)
        response = self.stub.GetCoOccurrences(request)

        # Check we got the right number of pairs
        self.assertLessEqual(len(response.pairs), 3)

        # Check each pair has count > 0
        for pair in response.pairs:
            self.assertGreater(pair.count, 0)
            self.assertTrue(pair.term1 and pair.term2)  # Terms shouldn't be empty

    def test_get_term_clusters(self):
        # Test term clustering
        docs = [
            "machine learning artificial intelligence",
            "deep learning neural networks",
            "data science machine learning",
            "artificial intelligence deep learning",
        ]
        request = tfidf_pb2.TermClustersRequest(documents=docs, n_clusters=2)
        response = self.stub.GetTermClusters(request)

        # Check we got the right number of clusters
        self.assertLessEqual(len(response.clusters), 2)

        # Check each cluster has terms
        for cluster_id, term_group in response.clusters.items():
            self.assertTrue(len(term_group.terms) > 0)

    def test_error_handling(self):
        # Test empty input
        with self.assertRaises(grpc.RpcError):
            self.stub.CleanText(tfidf_pb2.CleanTextRequest(text=""))

        # Test invalid window size
        with self.assertRaises(grpc.RpcError):
            self.stub.GetCoOccurrences(
                tfidf_pb2.CoOccurrenceRequest(
                    documents=["test"], window_size=-1, top_n=3
                )
            )

        # Test invalid cluster count
        with self.assertRaises(grpc.RpcError):
            self.stub.GetTermClusters(
                tfidf_pb2.TermClustersRequest(documents=["test"], n_clusters=0)
            )


if __name__ == "__main__":
    unittest.main()
