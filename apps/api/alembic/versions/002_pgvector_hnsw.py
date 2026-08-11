"""Add HNSW index for pgvector cosine ANN on document_chunks.embedding."""

from alembic import op

revision = "002_pgvector_hnsw"
down_revision = "001_initial"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # HNSW works well for demo-scale corpora and does not require IVFFlat training.
    op.execute(
        """
        CREATE INDEX IF NOT EXISTS ix_document_chunks_embedding_hnsw
        ON document_chunks
        USING hnsw (embedding vector_cosine_ops)
        """
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_document_chunks_embedding_hnsw")
