import grpc
from concurrent import futures
import tfidf_pb2
import tfidf_pb2_grpc
from text_processor import TextProcessor


class TFIDFServicer(tfidf_pb2_grpc.TFIDFServiceServicer):
    def __init__(self):
        self.processor = TextProcessor()

    def CleanText(self, request, context):
        if not request.text:
            context.abort(grpc.StatusCode.INVALID_ARGUMENT, "Text cannot be empty")
        cleaned_text = self.processor.clean_text(request.text)
        return tfidf_pb2.CleanTextResponse(cleaned_text=cleaned_text)

    def GetTopTerms(self, request, context):
        if not request.documents:
            context.abort(
                grpc.StatusCode.INVALID_ARGUMENT, "Documents list cannot be empty"
            )
        if request.max_features <= 0:
            context.abort(
                grpc.StatusCode.INVALID_ARGUMENT, "max_features must be positive"
            )
        if request.top_n <= 0:
            context.abort(grpc.StatusCode.INVALID_ARGUMENT, "top_n must be positive")

        top_terms = self.processor.get_top_terms(
            request.documents, request.max_features, request.top_n
        )
        return tfidf_pb2.TopTermsResponse(
            documents=[tfidf_pb2.DocumentTerms(terms=terms) for terms in top_terms]
        )

    def GetCoOccurrences(self, request, context):
        if not request.documents:
            context.abort(
                grpc.StatusCode.INVALID_ARGUMENT, "Documents list cannot be empty"
            )
        if request.window_size <= 0:
            context.abort(
                grpc.StatusCode.INVALID_ARGUMENT, "window_size must be positive"
            )
        if request.top_n <= 0:
            context.abort(grpc.StatusCode.INVALID_ARGUMENT, "top_n must be positive")

        pairs = self.processor.get_co_occurrences(
            request.documents, request.window_size, request.top_n
        )
        return tfidf_pb2.CoOccurrenceResponse(
            pairs=[
                tfidf_pb2.TermPair(term1=pair[0][0], term2=pair[0][1], count=pair[1])
                for pair in pairs
            ]
        )

    def GetTermClusters(self, request, context):
        if not request.documents:
            context.abort(
                grpc.StatusCode.INVALID_ARGUMENT, "Documents list cannot be empty"
            )
        if request.n_clusters <= 0:
            context.abort(
                grpc.StatusCode.INVALID_ARGUMENT, "n_clusters must be positive"
            )

        clusters = self.processor.get_term_clusters(
            request.documents, request.n_clusters
        )
        return tfidf_pb2.TermClustersResponse(
            clusters={k: tfidf_pb2.TermGroup(terms=v) for k, v in clusters.items()}
        )


def serve():
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    tfidf_pb2_grpc.add_TFIDFServiceServicer_to_server(TFIDFServicer(), server)
    server.add_insecure_port("[::]:50051")
    server.start()
    server.wait_for_termination()


if __name__ == "__main__":
    serve()
