# AI Financial Advisor with RAG

An enterprise-grade financial advisory platform designed to automate the analysis of complex corporate filings. This system leverages a **Retrieval-Augmented Generation (RAG)** architecture to synthesize insights from unstructured SEC 10-K data while providing a full audit trail back to original source documents.

---

## 🚀 Key Features

* **Intelligent RAG Pipeline**: Utilizes local embeddings (`all-MiniLM-L6-v2`) and **pgvector** to perform semantic search across a corpus of **191 SEC filings**.
* **Verification Loop**: Integrated **React IFrame workspace** allows users to view the original SEC HTM document side-by-side with AI-generated responses for 100% auditability.
* **Polyglot Microservices**: Engineered with **FastAPI** for high-performance AI orchestration and **Spring Boot** for robust enterprise reporting.
* **Automated Ingestion**: Custom pipeline transforms multi-gigabyte unstructured HTM documents into queryable, high-dimensional vector stores.
* **Silent Error Handling**: Custom middleware intercepts legacy SEC document asset 404s, ensuring a smooth, production-ready document viewing experience.

---

## 🏗️ Architecture

The system is built on a modern, containerized stack designed for scalability and data integrity:

* **Frontend**: React (Vite) + Material UI (MUI).
* **Backend (AI)**: Python (FastAPI), LangChain, HuggingFace.
* **Backend (Reporting)**: Java (Spring Boot).
* **Database**: PostgreSQL with the **pgvector** extension for vector similarity search.
* **Infrastructure**: Docker & Docker Compose for seamless environment orchestration.

---

## 🛠️ Setup & Installation

### Prerequisites

* Docker & Docker Compose
* Python 3.14+ (for local development)
* Node.js & npm

### Deployment

1. **Clone the repository:**
```bash
git clone https://github.com/Atharva310101/AI-Financial-Advisor-with-RAG.git
cd AI-Financial-Advisor-with-RAG

```


2. **Initialize the Database:**
```bash
docker-compose up -d

```


3. **Ingest Financial Data:**
Ensure your SEC JSON files are in the `10K-data/extracted` directory and the HTM files are in `10K-data/raw`, then run:
```bash
cd gs-advisor-backend
python batch_ingest.py

```


4. **Start the Backend:**
```bash
uvicorn app.main:app --reload

```


5. **Start the Frontend:**
```bash
cd ../frontend
npm install
npm run dev

```



---

## 📊 Business Impact

* **Efficiency**: Reduces manual document review time for analysts by an estimated **70%** through automated summarization.
* **Accuracy**: Eliminates hallucinations by grounding all LLM reasoning in verified corporate data.
* **Compliance**: Maintains a complete audit trail of every AI-driven query and response.

---

## 👨‍💻 Author

**Atharva Sameer Pargaonkar**

* MS in Computer Science, Boise State University
* Specialization in AI, Machine Learning, and Data Science
