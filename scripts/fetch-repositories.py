#!/usr/bin/env python3
"""
Fetch all repositories from Fadhel-SH GitHub account
This script fetches all 124 repositories with complete details
"""

import requests
import json
from datetime import datetime

def fetch_all_repositories(username='Fadhel-SH'):
    """Fetch all repositories from GitHub API with pagination"""
    url = f"https://api.github.com/users/{username}/repos"
    all_repos = []
    page = 1
    per_page = 100  # Maximum per page

    print(f"Fetching repositories for {username}...")

    while True:
        params = {
            'per_page': per_page,
            'page': page,
            'sort': 'updated',
            'direction': 'desc'
        }

        try:
            response = requests.get(url, params=params)
            response.raise_for_status()
            repos = response.json()

            if not repos:
                break

            all_repos.extend(repos)
            print(f"Fetched page {page}: {len(repos)} repositories")
            page += 1

        except requests.exceptions.RequestException as e:
            print(f"Error fetching page {page}: {e}")
            break

    print(f"\nTotal repositories fetched: {len(all_repos)}")
    return all_repos

def categorize_repository(repo):
    """Categorize repository based on name, description, and language"""
    name = repo['name'].lower()
    description = repo.get('description', '').lower() if repo.get('description') else ''
    language = repo.get('language', '').lower() if repo.get('language') else ''
    topics = [t.lower() for t in repo.get('topics', [])]

    # AI/ML/LLM
    ai_keywords = ['ai', 'ml', 'machine learning', 'llm', 'language model', 'gpt', 'claude', 'openai', 'huggingface', 'pytorch', 'tensorflow', 'diffusion', 'stable', 'flux', 'midjourney', 'sora', 'veo', 'inference', 'tensor', 'nemo', 'glm', 'moe']
    if any(kw in name or kw in description or kw in language or any(kw in t for t in topics) for kw in ai_keywords):
        return 'AI/ML/LLM'

    # Agents
    agent_keywords = ['agent', 'assistant', 'bot', 'autonomous', 'hermes', 'langchain', 'openclaw', 'skales', 'kilocode', 'codex', 'cursor', 'copilot', 'claude code']
    if any(kw in name or kw in description or any(kw in t for t in topics) for kw in agent_keywords):
        return 'Agents'

    # Desktop/Applications
    desktop_keywords = ['desktop', 'electron', 'app', 'mobile', 'android', 'ios', 'ui', 'interface', 'webui', 'aionui', 'cowork']
    if any(kw in name or kw in description or any(kw in t for t in topics) for kw in desktop_keywords):
        return 'Desktop/Applications'

    # Development Tools
    dev_keywords = ['ide', 'editor', 'code', 'cli', 'tool', 'dev', 'development', 'officecli', 'vscode', 'vscodroid', 'seo']
    if any(kw in name or kw in description or any(kw in t for t in topics) for kw in dev_keywords):
        return 'Development Tools'

    # Infrastructure
    infra_keywords = ['docker', 'kubernetes', 'aws', 'cloud', 'deploy', 'infrastructure', 'terraform', 'ci/cd', 'floci', 'emulator']
    if any(kw in name or kw in description or any(kw in t for t in topics) for kw in infra_keywords):
        return 'Infrastructure'

    # Security
    security_keywords = ['security', 'crypto', 'encryption', 'auth', 'key', 'vault']
    if any(kw in name or kw in description or any(kw in t for t in topics) for kw in security_keywords):
        return 'Security'

    # Data/Database
    data_keywords = ['database', 'db', 'data', 'storage', 'sql', 'nosql', 'mongo', 'postgres']
    if any(kw in name or kw in description or any(kw in t for t in topics) for kw in data_keywords):
        return 'Data/Database'

    # UI/Frontend
    ui_keywords = ['react', 'vue', 'angular', 'frontend', 'component', 'ui', 'interface', 'dashboard']
    if any(kw in name or kw in description or any(kw in t for t in topics) for kw in ui_keywords):
        return 'UI/Frontend'

    # API/Gateway
    gateway_keywords = ['gateway', 'api', 'router', 'route', 'endpoint', 'omniroute', '9router']
    if any(kw in name or kw in description or any(kw in t for t in topics) for kw in gateway_keywords):
        return 'API/Gateway'

    # Automation
    automation_keywords = ['automation', 'workflow', 'script', 'task', 'job', 'ticket']
    if any(kw in name or kw in description or any(kw in t for t in topics) for kw in automation_keywords):
        return 'Automation'

    # Entertainment
    entertainment_keywords = ['game', 'emulator', 'playstation', 'ps5', 'kyty', 'pacman', 'animation', 'video']
    if any(kw in name or kw in description or any(kw in t for t in topics) for kw in entertainment_keywords):
        return 'Entertainment'

    return 'Other'

def determine_relevance(repo, category):
    """Determine relevance to Ultra AI Platform"""
    name = repo['name'].lower()
    description = repo.get('description', '').lower() if repo.get('description') else ''

    # Already imported
    imported_repos = ['9router', 'ai-agentic-_jarvis', 'ai-assistant_openclaw', 'app_webui-desktop', 'ai-tools_quant-mind', 'ai-model_kimi-k2.5', 'ai-models_biome', 'tools_godmodeanimation']
    if name in imported_repos:
        return 'IMPORTED'

    # Critical for AI Platform
    critical_keywords = ['gateway', 'router', 'agent', 'assistant', 'intelligence', 'jarvis', 'openclaw', 'ai', 'ml', 'llm', 'multimodal', 'quant', 'financial', 'world', 'biome', 'animation', 'comfyui', 'kilocode', 'skales', 'aionui', 'omniroute', 'nemo', 'tensor', 'colibri', 'hyperframes', 'understand']
    if any(kw in name or kw in description for kw in critical_keywords):
        if category in ['AI/ML/LLM', 'Agents', 'API/Gateway', 'Desktop/Applications']:
            return 'CRITICAL'
        elif category in ['Development Tools', 'Infrastructure']:
            return 'HIGH'
        else:
            return 'MEDIUM'

    # High priority for development
    if category in ['Development Tools', 'Infrastructure', 'Security']:
        return 'HIGH'

    # Medium priority
    if category in ['UI/Frontend', 'Data/Database', 'Automation']:
        return 'MEDIUM'

    # Low priority
    if category in ['Entertainment']:
        return 'LOW'

    # Skip
    if category == 'Other':
        return 'SKIP'

    return 'MEDIUM'

def analyze_repositories(repos):
    """Analyze and categorize all repositories"""
    categories = {}
    relevance = {}
    categorized_repos = {}

    for repo in repos:
        category = categorize_repository(repo)
        relevance_level = determine_relevance(repo, category)

        # Count categories
        categories[category] = categories.get(category, 0) + 1

        # Count relevance
        relevance[relevance_level] = relevance.get(relevance_level, 0) + 1

        # Add to categorized list
        if category not in categorized_repos:
            categorized_repos[category] = []
        categorized_repos[category].append({
            'name': repo['name'],
            'url': repo['html_url'],
            'description': repo.get('description') or 'N/A',
            'language': repo.get('language') or 'N/A',
            'stars': repo['stargazers_count'],
            'forks': repo['forks_count'],
            'updated': repo.get('updated_at') or 'N/A',
            'is_fork': repo['fork'],
            'relevance': relevance_level,
            'category': category
        })

    return categories, relevance, categorized_repos

def generate_markdown_report(repos, categories, relevance, categorized_repos):
    """Generate comprehensive markdown report"""
    report = []
    report.append("# Fadhel-SH Complete Repository Analysis\n")
    report.append(f"**Total Repositories**: {len(repos)}\n")
    report.append(f"**Analysis Date**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
    report.append(f"**GitHub URL**: https://github.com/Fadhel-SH?tab=repositories\n")

    # Executive Summary
    report.append("## Executive Summary\n")
    report.append(f"- Total repositories analyzed: **{len(repos)}**\n")
    report.append(f"- Categories identified: **{len(categories)}**\n")
    report.append(f"- Relevance levels: **{len(relevance)}**\n")
    report.append("\n")

    # Category Breakdown
    report.append("## Category Breakdown\n")
    report.append("| Category | Count | Percentage |\n")
    report.append("|----------|-------|------------|\n")
    for cat, count in sorted(categories.items(), key=lambda x: x[1], reverse=True):
        percentage = (count / len(repos)) * 100
        report.append(f"| {cat} | {count} | {percentage:.1f}% |\n")
    report.append("\n")

    # Relevance Breakdown
    report.append("## Relevance Breakdown\n")
    report.append("| Relevance | Count | Percentage |\n")
    report.append("|-----------|-------|------------|\n")
    for rel, count in sorted(relevance.items(), key=lambda x: x[1], reverse=True):
        percentage = (count / len(repos)) * 100
        report.append(f"| {rel} | {count} | {percentage:.1f}% |\n")
    report.append("\n")

    # Complete Repository List by Category
    report.append("## Complete Repository List\n")
    for category in sorted(categorized_repos.keys()):
        repos_list = categorized_repos[category]
        report.append(f"### {category} ({len(repos_list)} repositories)\n")
        report.append("| # | Repository | URL | Description | Language | Stars | Forks | Updated | Relevance |\n")
        report.append("|---|-----------|-----|-------------|----------|-------|-------|---------|-----------|\n")
        for idx, repo in enumerate(repos_list, 1):
            fork_status = "🔴 Fork" if repo['is_fork'] else "🟢 Original"
            desc = repo['description'][:50] + '...' if repo['description'] and len(repo['description']) > 50 else (repo['description'] or 'N/A')
            updated = repo['updated'][:10] if repo['updated'] != 'N/A' else 'N/A'
            report.append(f"| {idx} | **{repo['name']}** | {repo['url']} | {desc} | {repo['language']} | {repo['stars']} | {repo['forks']} | {updated} | {repo['relevance']} {fork_status} |\n")
        report.append("\n")

    # Top Critical Repositories
    report.append("## Top Critical Repositories for Immediate Integration\n")
    critical_repos = []
    for category, repos_list in categorized_repos.items():
        for repo in repos_list:
            if repo['relevance'] in ['CRITICAL', 'IMPORTED']:
                critical_repos.append(repo)

    critical_repos.sort(key=lambda x: x['stars'], reverse=True)
    report.append("| Rank | Repository | Category | Stars | Relevance | Action |\n")
    report.append("|------|-----------|----------|-------|-----------|--------|\n")
    for idx, repo in enumerate(critical_repos[:20], 1):
        action = "✅ Imported" if repo['relevance'] == 'IMPORTED' else "📥 Import"
        report.append(f"| {idx} | **{repo['name']}** | {repo['category']} | {repo['stars']} | {repo['relevance']} | {action} |\n")
    report.append("\n")

    # Recommended Import Order
    report.append("## Recommended Import Order\n")
    report.append("### Phase 1: Core AI Infrastructure (Already Done)\n")
    report.append("- ✅ 9router - AI Gateway\n")
    report.append("- ✅ OpenClaw - Personal Assistant\n")
    report.append("- ✅ JARVIS - Intelligence System\n")
    report.append("- ✅ WebUI Desktop - Desktop Interface\n")
    report.append("\n")

    report.append("### Phase 2: Advanced AI Capabilities (Import Next)\n")
    high_priority = []
    for category, repos_list in categorized_repos.items():
        for repo in repos_list:
            if repo['relevance'] == 'CRITICAL' and repo['relevance'] != 'IMPORTED':
                high_priority.append(repo)

    for repo in high_priority[:10]:
        report.append(f"- 📥 {repo['name']} - {repo['description'][:60]}...\n")
    report.append("\n")

    report.append("### Phase 3: Development Tools\n")
    dev_tools = categorized_repos.get('Development Tools', [])
    for repo in dev_tools[:5]:
        report.append(f"- 📥 {repo['name']} - {repo['description'][:60]}...\n")
    report.append("\n")

    return ''.join(report)

def main():
    """Main execution"""
    print("Starting repository analysis...")

    # Fetch all repositories
    repos = fetch_all_repositories()

    if not repos:
        print("No repositories found!")
        return

    # Analyze repositories
    categories, relevance, categorized_repos = analyze_repositories(repos)

    # Generate report
    report = generate_markdown_report(repos, categories, relevance, categorized_repos)

    # Save report
    output_file = 'external-integrations/FADHEL-SH-COMPLETE-ANALYSIS.md'
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(report)

    print(f"\nReport saved to: {output_file}")
    print(f"Total repositories analyzed: {len(repos)}")
    print(f"Categories: {len(categories)}")
    print(f"Relevance levels: {len(relevance)}")

    # Also save raw JSON
    json_file = 'external-integrations/FADHEL-SH-REPOS-RAW.json'
    with open(json_file, 'w', encoding='utf-8') as f:
        json.dump(categorized_repos, f, indent=2)
    print(f"Raw data saved to: {json_file}")

if __name__ == '__main__':
    main()