from app.schemas.workflow import RunDecision


def test_run_decision_schema():
    approved = RunDecision(approved=True, note="looks good")
    rejected = RunDecision(approved=False)
    assert approved.approved is True
    assert approved.note == "looks good"
    assert rejected.approved is False
    assert rejected.note == ""
