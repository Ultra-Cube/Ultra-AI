# GenAIOps Prompt Flow Template

End-to-end solution template for GenAIOps using Azure Machine Learning Prompt Flow.

## What This Workflow Does

1. **Experiment** — Develop and test prompt variants locally
2. **Evaluate** — Run bulk tests with built-in evaluation flows
3. **Deploy** — CI/CD pipeline deploys to Azure ML endpoints
4. **Monitor** — A/B testing and performance tracking

## Getting Started

```bash
git clone https://github.com/microsoft/genaiops-promptflow-template
cd genaiops-promptflow-template
pip install -r requirements.txt
```

## Prerequisites

- Azure subscription
- Azure ML workspace
- Python 3.9+

## Permissions

- Full filesystem access (reads/writes flow files)
- Shell execution (runs evaluation scripts)
- Network access (Azure ML API calls)
- Git write (CI/CD pipeline commits)
