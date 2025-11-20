---
title: "Why Four Eyes Check Is Dangerous"
date: 2017-01-28
categories: [Cybersecurity]
tags: [Security, Risk Management, Governance, Human Factors, Controls, Production, Code Review]
excerpt: "Four eyes checks seem like perfect controls—two people reviewing critical actions should catch errors and prevent problems. But this widely trusted practice creates dangerous blind spots in security, production deployments, and operational decisions."
---

Four eyes checks are everywhere. Banks require dual approval for large transactions. IT teams mandate peer review before production deployments. Manufacturing requires dual sign-off on quality checks. Finance departments enforce dual signatures on payments. Operations teams require two engineers to approve infrastructure changes. The logic seems bulletproof—two people reviewing the same action should catch mistakes and prevent problems.

This control appears everywhere. Security frameworks mandate segregation of duties. DevOps practices require code review. Manufacturing enforces dual quality checks. Maker-checker processes span industries. Two sets of eyes reviewing critical actions should provide robust protection against errors, fraud, and catastrophic mistakes.

But this widely trusted control creates dangerous vulnerabilities. Organizations implement four eyes checks and assume they're protected. They reduce other controls, believing dual approval provides sufficient safety. This false confidence creates blind spots where critical bugs reach production, security vulnerabilities slip through code review, and operational errors cause outages.

## Why I'm Writing This

I've watched four eyes checks fail repeatedly across different organizations and contexts. A critical production bug that two senior developers approved in code review. A fraudulent transaction that passed dual authorization. An infrastructure change that caused a major outage despite two engineers signing off. Each time, the post-incident review revealed the same pattern: both reviewers rubber stamped without actually verifying.

One pattern I've seen repeatedly is organizations breaking down processes into multiple subprocesses, each with its own approval steps. A deployment process gets divided into: code review (two approvals), security review (two approvals), infrastructure review (two approvals), and final deployment approval (two approvals). Eight people approve the same deployment across four stages. Organizations believe this provides defense in depth—multiple checkpoints catching different issues.

But this creates the opposite effect. Each reviewer assumes other stages will catch problems. The code reviewers assume security review will catch vulnerabilities. Security reviewers assume code review verified functionality. Infrastructure reviewers assume both previous stages validated the change. Final approvers assume all previous approvals mean the deployment is safe. Nobody performs comprehensive review because everyone believes someone else already did.

The subprocess approach also fragments context. Code reviewers see code changes but not infrastructure impact. Infrastructure reviewers see configuration changes but not business logic. Security reviewers see potential vulnerabilities but not operational constraints. Each subprocess reviews a piece without understanding the whole. Critical issues that span multiple areas slip through because no single reviewer has complete context.

What troubles me most isn't that these controls fail—it's that organizations continue trusting them blindly. After each incident, the response is typically "we need better training" or "reviewers need to be more careful" or "we need more approval stages." Nobody questions whether the control itself is fundamentally flawed.

This article examines why four eyes checks fail so consistently, when they actually work, and what alternatives provide better protection. The problem isn't the concept—it's how humans actually behave when performing these checks under real-world conditions.

## The Psychology of Approval Fatigue

When someone asks you to approve something, what actually happens in your mind?

### The Rubber Stamp Effect

!!!error "⚠️ Approval Fatigue Patterns"
    **Volume Overwhelms Scrutiny**
    - Approvers face dozens of requests daily
    - Each review takes time and mental energy
    - Pressure to maintain workflow speed
    - Default behavior shifts to approval
    
    **Trust Replaces Verification**
    - "They wouldn't submit it if it wasn't right"
    - Assumption that first reviewer did thorough check
    - Relationship trust overrides process verification
    - Social pressure to not delay colleagues
    
    **Responsibility Diffusion**
    - "Someone else will catch problems"
    - Shared responsibility becomes no responsibility
    - Each reviewer assumes the other checked carefully
    - Blame becomes distributed when failures occur

The first reviewer submits a transaction for approval. The second reviewer sees a colleague's request. They trust this person. They work together daily. The requester wouldn't submit something incorrect or fraudulent—they're trustworthy.

This psychological shortcut transforms verification into rubber stamping. The second reviewer glances at the request, sees familiar patterns, and approves. They don't verify account numbers, don't recalculate amounts, don't validate business justification. They trust.

### The Expertise Illusion

Organizations often assign four eyes checks to people with similar roles and expertise. Two developers review code changes. Two accountants approve journal entries. Two system administrators authorize configuration changes.

Some organizations try to solve this by having managers review their team's work. An IT manager reviews engineers' production changes. A development manager approves code from their team. This seems better—managers have accountability, broader perspective, and authority. But it fails for different reasons.

This creates a dangerous illusion—that similar expertise provides independent verification. But people with similar backgrounds share similar blind spots:

!!!anote "🎭 Shared Blind Spots"
    **Common Mental Models**
    - Same training creates same assumptions
    - Similar experience leads to similar mistakes
    - Shared expertise means shared gaps
    - Industry practices become unquestioned norms
    
    **Professional Bias**
    - "This is how we've always done it"
    - Technical correctness overshadows business risk
    - Focus on familiar aspects, ignore unfamiliar
    - Expertise creates confidence, reduces questioning

Two developers reviewing code both miss the same security vulnerability because their training never covered that attack vector. Two accountants approve the same fraudulent entry because both learned the same outdated control procedures. Two operations engineers approve a configuration change that will cause cascading failures because both assume the load balancer will handle it. Similar expertise doesn't provide independent verification—it amplifies shared weaknesses.

### The Manager Review Myth

Many organizations believe manager reviews solve the four eyes check problem. Managers have accountability, authority, and supposedly broader perspective. An IT manager reviewing engineer deployments should catch issues that peer reviews miss. But manager reviews fail consistently:

**Technical Depth vs Breadth Trade-off**: Managers gain breadth but lose technical depth. An IT manager reviewing 20 engineers' work can't maintain deep expertise in every technology stack, framework version, and system architecture. They review at a superficial level—checking that tests exist, not whether tests are comprehensive. Verifying documentation is present, not whether it's accurate. Confirming the change follows process, not whether it's technically sound.

**Volume Overwhelms Capacity**: Managers review everything their team produces. A manager with 10 engineers might review 50+ changes per week. Each review gets 5-10 minutes. Thorough technical review takes 30-60 minutes. The math doesn't work. Managers become bottlenecks who rubber stamp to keep workflow moving.

**Trust Overrides Verification**: Managers trust their team members differently than peers do. A manager who hired an engineer, mentored them, and gave them positive performance reviews has invested in that person's competence. Questioning their work feels like questioning their own judgment. Managers approve based on who submitted the work, not what the work contains.

**Authority Creates Pressure**: When managers review, engineers feel pressure to defend their work rather than accept feedback. Challenging a manager's technical concerns risks career consequences. Engineers learn to present work confidently, and managers learn to trust confident presentations. The review becomes a performance rather than verification.

**Accountability Doesn't Equal Capability**: Managers have accountability for outcomes, but that doesn't give them capability to catch every issue. After incidents, managers face consequences—but that doesn't mean they could have prevented the incident through better review. Accountability without capability just creates blame without improving outcomes.

## The Collusion Problem

Four eyes checks assume independence between reviewers. But humans form relationships, alliances, and sometimes conspiracies.

### Gaming the System

Four eyes checks create predictable patterns that people learn to exploit—not always maliciously, sometimes just to get work done.

**Relationship Exploitation**: Trust replaces verification. In security contexts, fraudsters build relationships with both reviewers over time. In development teams, developers form review partnerships where each rubber stamps the other's code. In operations, engineers who work night shifts together develop mutual approval patterns. The relationship becomes the basis for approval rather than the quality of work.

**Sequential Compromise**: In security, attackers compromise one reviewer through social engineering or coercion. In production environments, one engineer pushes for a risky deployment, and the second reviewer—seeing a trusted colleague's approval request—rubber stamps it. The pattern is identical whether the intent is malicious or just expedient.

**Mutual Benefit Schemes**: Two insiders collude for mutual benefit. In finance, they take turns approving fraudulent transactions. In development, they take turns approving each other's poorly tested code to meet sprint deadlines. In operations, they approve each other's shortcuts to avoid documentation work. The control designed to prevent problems becomes the mechanism enabling them.

### The Subprocess Fragmentation Problem

I've observed organizations respond to four eyes check failures by adding more approval stages. They break processes into subprocesses, each with dual approval. This seems logical—more checkpoints should catch more issues. But it creates dangerous fragmentation.

**Responsibility Diffusion Across Stages**: When a deployment requires code review approval, security review approval, infrastructure review approval, and operations approval, each reviewer assumes others are checking comprehensively. Code reviewers focus narrowly on code quality, assuming security review will catch vulnerabilities. Security reviewers scan for known vulnerabilities, assuming code review verified business logic. Infrastructure reviewers check configuration syntax, assuming previous stages validated the change makes sense. Operations approvers see three previous approval stages and rubber stamp. Everyone approves their narrow piece while nobody verifies the whole.

**Context Fragmentation**: Each subprocess sees only part of the picture. Code reviewers see a database query optimization but don't know it will cause lock contention during peak hours. Infrastructure reviewers see a cache configuration change but don't know it breaks a critical application feature. Security reviewers see an authentication change but don't know it impacts a business-critical integration. The complete picture exists nowhere—it's fragmented across subprocess boundaries.

**Approval Fatigue Multiplication**: Instead of reducing approval fatigue, subprocesses multiply it. A single deployment now requires 8 approvals instead of 2. Each approver faces even higher volume because they're reviewing every change that touches their subprocess. The code review team reviews everything. The security team reviews everything. The infrastructure team reviews everything. Volume overwhelms every stage simultaneously.

**False Confidence Amplification**: Multiple approval stages create false confidence that scales with the number of stages. "This deployment has 8 approvals across 4 stages—it must be thoroughly vetted." Auditors see extensive approval trails and assume rigorous review occurred. Management sees multiple checkpoints and believes risk is controlled. The reality is 8 people rubber stamped without comprehensive review, but the appearance of control is stronger than ever.

### The Pressure Cooker

Organizations create environments where four eyes checks become obstacles rather than controls:

!!!error "🔥 Pressure Points"
    **Time Pressure**
    - "This needs approval NOW"
    - Production outages demand immediate fixes
    - Business deadlines override security process
    - Delayed approvals blamed for missed opportunities
    
    **Authority Pressure**
    - Senior executives requesting approval
    - "The CEO needs this done today"
    - Career consequences for blocking requests
    - Power dynamics override control effectiveness
    
    **Peer Pressure**
    - "Don't be difficult"
    - Team cohesion valued over verification
    - Thorough reviewers labeled as obstructionist
    - Social costs for questioning colleagues

Under pressure, four eyes checks collapse. The second reviewer approves quickly to avoid conflict, maintain relationships, or prevent career damage. The control exists on paper but provides no actual protection.

## The False Security Paradox

The most dangerous aspect of four eyes checks isn't that they fail—it's that organizations believe they work.

### Reduced Vigilance

When organizations implement four eyes checks, they often reduce other controls:

**Monitoring Decreases**: "We have dual approval, so we don't need to monitor these transactions as closely." In security, automated alerts get disabled. In production, deployment monitoring gets relaxed. In operations, change tracking becomes less rigorous. Detective controls weaken because preventive controls seem sufficient.

**Technical Controls Weaken**: "We have human review, so we don't need system validations." In security, input validation gets simplified. In development, automated testing requirements decrease because "code review will catch issues." In operations, automated health checks get skipped because "two engineers approved the change." Technical safeguards erode because human judgment seems more flexible and reliable.

**Testing Decreases**: "We have peer review, so we don't need extensive testing." Integration tests get skipped. Load testing becomes optional. Rollback procedures go untested. The assumption that two people reviewed the code replaces actual validation that it works.

**Audit Scope Narrows**: "These changes have dual approval, so we'll focus audit efforts elsewhere." Security auditors spend less time reviewing dual-approved transactions. Production incident reviews skip dual-approved deployments. The control that should receive scrutiny gets assumed to be working.

This creates a dangerous paradox—the presence of four eyes checks reduces overall safety by creating false confidence that weakens other defenses.

### Compliance Theater

Four eyes checks become checkbox exercises that satisfy requirements without providing real protection:

!!!anote "📋 Process vs Reality"
    **Process Over Substance**
    - Control exists in documentation
    - Approvals happen but verification doesn't
    - Audit trails show dual signatures
    - Evidence of process, not evidence of effectiveness
    
    **Measurement Failure**
    - Metrics track approval speed, not quality
    - Success measured by process completion
    - No measurement of errors caught
    - No validation of reviewer diligence
    
    **Production Examples**
    - Git shows two approvals on pull request
    - Deployment logs show two engineers signed off
    - Change tickets show dual authorization
    - But none prove actual review occurred

Organizations demonstrate compliance by showing dual approvals in logs. Security audits see dual signatures on transactions. DevOps dashboards show two approvals per deployment. Change management systems display dual authorization. But logs don't reveal whether reviewers actually verified anything. They show two people clicked "approve"—not that two people independently validated the work.

## When Four Eyes Checks Work (And When They Don't)

Four eyes checks aren't inherently useless—but they require specific conditions to be effective.

### Success Conditions

!!!anote "✅ When Four Eyes Checks Work"
    **True Independence**
    - Different departments or business units
    - No reporting relationship between reviewers
    - Separate performance incentives
    - Physical or organizational separation
    
    **Clear Verification Criteria**
    - Specific items to check documented
    - Objective validation requirements
    - Checklists for complex reviews
    - Evidence of verification required
    
    **Manageable Volume**
    - Limited number of reviews per person
    - Sufficient time allocated for thorough review
    - No pressure to approve quickly
    - Quality valued over speed
    
    **Accountability Mechanisms**
    - Individual reviewer identity tracked
    - Periodic quality audits of approvals
    - Consequences for rubber stamping
    - Rewards for catching errors

#### True Independence

Independence means reviewers have no incentive to approve questionable requests. This requires organizational separation, not just different people. When a finance manager reviews transactions submitted by their own department, independence doesn't exist—they share the same goals, pressures, and incentives. Real independence means the reviewer comes from a different business unit with separate performance metrics and budget accountability.

Manager reviews fail the independence test. Managers reviewing their own team's work have every incentive to approve. Their performance metrics depend on team productivity. Their reputation depends on team competence. Their budget depends on demonstrating team value. Blocking a deployment delays their team's deliverables. Catching errors reflects poorly on their hiring and training. Managers are not independent—they're invested stakeholders.

In production environments, independence means developers don't review code from their immediate team members working on the same sprint. It means operations engineers from different shifts or regions review each other's infrastructure changes. It means security teams review access requests rather than the requesting department approving its own needs. It means managers don't review their own team's work—independent teams or automated systems do.

Physical or organizational separation creates natural independence. A reviewer in a different office, time zone, or reporting chain has less relationship pressure and different contextual biases. They're more likely to question assumptions and catch issues that seem normal to insiders. A manager reviewing their own team has maximum relationship pressure and identical contextual biases.

#### Clear Verification Criteria

Vague instructions like "review and approve if acceptable" guarantee rubber stamping. Effective four eyes checks provide explicit checklists: verify account number matches invoice, confirm amount doesn't exceed threshold, validate business justification includes cost center code, check approval authority matches transaction size.

In code review, clear criteria means: verify unit tests cover new functionality, confirm no hardcoded credentials exist, validate error handling for all external calls, check that database queries use parameterized statements. Reviewers know exactly what to verify rather than making subjective judgments about code quality.

Documented criteria also create accountability. When incidents occur, you can determine whether reviewers followed the checklist. Without criteria, reviewers can claim they reviewed "appropriately" even when they rubber stamped.

#### Manageable Volume

Human attention is finite. A reviewer handling 5 approvals per day can thoroughly verify each one. A reviewer handling 50 approvals per day must rush through them. Volume overwhelms diligence.

Effective four eyes checks limit volume through automation and risk-based approaches. Low-risk transactions get automated approval. Medium-risk transactions get single approval with automated validation. Only high-risk transactions require dual human review. This keeps volume manageable and focuses human attention where it matters most.

Time allocation matters equally. If thorough review takes 15 minutes but reviewers have 5 minutes per approval, the math doesn't work. Organizations must either reduce volume, increase reviewer capacity, or accept that reviews will be superficial.

#### Accountability Mechanisms

Without accountability, four eyes checks become rubber stamps. Effective accountability means tracking individual reviewer identity, not just "two people approved." When incidents occur, you need to know who approved what and whether they followed verification procedures.

Periodic quality audits sample approved transactions and verify reviewers actually checked required items. Did they validate the account number? Did they confirm the business justification? Did they verify the code changes matched the description? Audits reveal whether reviewers are diligent or rubber stamping.

Consequences matter. If rubber stamping has no consequences, it becomes the norm. If thorough reviewers who catch errors get rewarded while rubber stampers face accountability, behavior changes. Most organizations track approvals but never measure quality—ensuring mediocrity.

### Failure Conditions

!!!error "❌ When Four Eyes Checks Fail"
    **High Volume + Time Pressure**
    - Dozens of approvals per day per reviewer
    - Urgent requests demanding immediate approval
    - Workflow bottlenecks blamed on review delays
    - Speed metrics prioritized over quality
    
    **Relationship Dependencies**
    - Reviewers work on same team
    - Social relationships override verification
    - Career consequences for blocking colleagues
    - Trust replaces independent validation
    
    **Vague Criteria**
    - "Review and approve if acceptable"
    - No checklist of what to verify
    - Subjective judgment without guidelines
    - No evidence of what was actually checked
    
    **No Accountability**
    - Approvals tracked but quality isn't
    - No consequences for rubber stamping
    - Blame diffuses when failures occur
    - No measurement of errors caught vs missed

#### The Reality Gap

Most organizations operate under failure conditions while expecting success outcomes. They implement four eyes checks with same-team reviewers (no independence), vague "review and approve" instructions (no clear criteria), dozens of daily approvals per person (unmanageable volume), and no measurement of review quality (no accountability). Then they wonder why critical issues slip through.

When failures occur, organizations often respond by adding more subprocess approval stages rather than fixing the fundamental problems. This makes things worse—multiplying approval fatigue, fragmenting context, and amplifying false confidence while doing nothing to address independence, criteria, volume, or accountability issues.

The success conditions aren't optional nice-to-haves—they're mandatory requirements. Without all four conditions, four eyes checks provide theater rather than protection. Adding more approval stages without these conditions just creates more elaborate theater. Organizations must either create these conditions or acknowledge the control doesn't actually work and implement alternatives.

## Better Alternatives: Automation Over Human Diligence

The fundamental problem with four eyes checks is they depend on human diligence under conditions that make diligence nearly impossible. The solution isn't better training or stricter policies—it's automation.

Humans are terrible at repetitive verification tasks. We get fatigued, distracted, and complacent. We're influenced by relationships, pressure, and cognitive biases. But we're excellent at judgment calls, creative problem-solving, and handling novel situations.

Effective controls leverage automation for what machines do well and reserve human judgment for what humans do well:

### Automated Validation

Automated validation provides consistent, tireless enforcement of rules that humans struggle to apply reliably. More importantly, automated controls improve continuously as policies evolve and new threats emerge.

**Business Rule Enforcement**: Systems validate transactions against business rules automatically. Invalid transactions get rejected before human review. Humans review exceptions, not routine transactions. As compliance requirements change, rules get updated in code and immediately apply to all transactions. New regulatory requirements become automated checks rather than training topics.

**Automated Testing**: Comprehensive test suites validate code changes automatically. Unit tests verify functionality. Integration tests catch interaction bugs. Load tests validate performance. Security scans detect vulnerabilities. Humans review test results, not just code. When new vulnerability patterns emerge, security scanning tools get updated and immediately check all code. When performance requirements change, load test thresholds adjust automatically.

**Pattern Detection**: Anomaly detection identifies unusual transactions for review. Machine learning flags deviations from normal patterns. Deployment monitoring detects abnormal behavior. Human review focuses on genuinely suspicious activity. As attack patterns evolve, detection models retrain on new data. As system behavior changes, baselines adjust automatically.

**Limit Controls**: Hard limits prevent excessive transactions regardless of approval. System-enforced thresholds can't be overridden by dual approval. Deployment gates block changes that fail automated checks. Technical controls provide backstop for human judgment. When risk tolerance changes, limits update centrally and apply immediately across all systems.

**Continuous Improvement**: The key advantage of automated validation is continuous improvement. When incidents occur, new checks get added to prevent recurrence. When compliance policies change, validation rules update immediately. When new security vulnerabilities are discovered, scanning tools detect them in all code. Human reviewers must be retrained individually and hope they remember new requirements under pressure. Automated systems enforce new requirements consistently from the moment they're deployed.

Every incident becomes an opportunity to strengthen automated controls. A production bug that slipped through code review becomes a new automated test. A fraudulent transaction that passed dual approval becomes a new business rule check. A security vulnerability that two reviewers missed becomes a new scanning rule. The system learns from failures and prevents them systematically rather than hoping humans remember lessons learned.

### Segregation of Duties

**Functional Separation**: Different people perform different functions in a process. One person initiates, another approves, a third reconciles. No single person controls the entire process.

**System-Enforced Separation**: Systems prevent the same user from performing conflicting functions. Technical controls enforce segregation automatically. Human collusion becomes insufficient to bypass controls.

### Detective Controls

**Continuous Monitoring**: All transactions monitored for suspicious patterns. Production deployments monitored for errors and performance degradation. Alerts trigger investigation of anomalies. Detection happens regardless of approval process.

**Canary Deployments**: Changes roll out to small percentage of users first. Automated monitoring detects problems before full deployment. Issues caught with limited blast radius. Gradual rollout provides multiple validation points.

**Regular Reconciliation**: Independent reconciliation catches errors and fraud after the fact. Post-deployment validation verifies changes work as intended. Discrepancies trigger investigation. Multiple layers of verification over time.

**Audit Sampling**: Random sampling of dual-approved transactions. Quality checks of deployed code verify reviewer diligence. Post-incident reviews examine approval quality. Accountability for approval quality maintained.

## The Path Forward

Four eyes checks will continue existing—they're embedded in regulations, standards, and corporate policies. But understanding their limitations enables better outcomes:

**Don't Rely Solely on Four Eyes Checks**: Layer multiple controls. Combine human review with automated validation. Use detective controls to catch failures. In production, pair code review with automated testing, canary deployments, and monitoring.

**Design for Human Behavior**: Acknowledge that humans rubber stamp under pressure. Reduce approval volume. Provide clear verification criteria. Give reviewers checklists of what to verify. Measure quality, not just speed. Track what percentage of reviews catch actual issues.

**Maintain Independence**: Ensure reviewers are truly independent. Separate organizational units. Different incentive structures. No relationship dependencies. Rotate review assignments to prevent partnership patterns.

**Verify the Verifiers**: Audit approval quality regularly. Sample dual-approved transactions and deployments. Review incidents to see if approval process failed. Hold reviewers accountable for diligence. Reward those who catch errors.

**Automate What Humans Do Poorly**: Humans are bad at repetitive verification but good at judgment calls. Automate syntax checking, security scanning, test execution, and compliance validation. Reserve human review for architectural decisions, business logic, and edge cases.

**Invest in Continuous Improvement**: Treat automated controls as living systems that evolve with threats and requirements. When incidents occur, update automated checks to prevent recurrence. When policies change, update validation rules immediately. When new vulnerabilities emerge, update scanning tools to detect them. Automated controls that improve continuously provide better protection than human reviews that depend on memory and diligence.

Four eyes checks aren't inherently dangerous—but blind faith in them is. They're one control among many, effective only under specific conditions, and vulnerable to human nature. Organizations that understand these limitations build better systems. Those that don't create dangerous blind spots while believing they're protected.

The best organizations don't ask "Do we have four eyes checks?" They ask "Are our four eyes checks actually working, what happens when they fail, and what automated controls back them up?" They invest in automated validation that improves continuously rather than human processes that degrade under pressure.
