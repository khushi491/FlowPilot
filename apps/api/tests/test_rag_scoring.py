from app.services.rag import distance_to_score


def test_distance_to_score_identity():
    assert distance_to_score(0.0) == 1.0


def test_distance_to_score_far():
    assert distance_to_score(1.0) == 0.0
    assert distance_to_score(2.0) == 0.0
