---
title: "Kanban vs Scrum: Choosing the Right Agile Framework"
date: 2014-04-04
categories: Development
tags: [Agile, Scrum, Kanban, Project Management]
series: agile
excerpt: "Scrum and Kanban both promise agility, but they work differently. Understand when to use each framework, how to combine them, and avoid common pitfalls that turn process into bureaucracy."
thumbnail: /assets/agile/thumbnail.png
---

Teams adopting Agile face an immediate choice: Scrum or Kanban? The question appears simple, but the answer shapes how teams work, plan, and deliver software. Choose wrong, and you'll fight the framework instead of benefiting from it. Choose right, and the framework amplifies your team's effectiveness.

The debate between Scrum and Kanban generates strong opinions. Scrum advocates praise its structure and predictability. Kanban proponents value its flexibility and flow. Both camps claim their approach is "more Agile." The truth is more nuanced: neither framework is universally superior. Each excels in different contexts, and many successful teams blend elements from both.

This exploration cuts through the dogma to examine what Scrum and Kanban actually do, when each works best, and how to choose—or combine—frameworks for your specific situation. Drawing from teams that succeeded and failed with both approaches, we'll uncover the real differences that matter.

## Understanding the Fundamentals

Before comparing frameworks, understanding what each actually provides is essential. Scrum and Kanban aren't just different flavors of the same thing—they represent fundamentally different approaches to managing work.

### Scrum: Rhythm and Commitment

Scrum organizes work into fixed-length iterations called sprints:

Scrum creates predictability through its rhythmic structure of fixed-length sprints, typically two weeks, where teams commit to delivering specific work. This time-boxed approach forces regular decision points—what to build, how to build it, and whether it's working. The commitment isn't just to complete tasks; it's a promise to deliver working software that stakeholders can see, touch, and provide feedback on. Sprint boundaries create natural synchronization points for the entire organization: developers know when to integrate their work, product owners know when to expect demos, and stakeholders know when they'll see progress. This rhythm transforms chaotic development into a predictable cadence where everyone understands the tempo. The commitment aspect matters because it drives focus—once a sprint starts, the team protects that commitment by saying no to new requests and yes to finishing what they started. This combination of rhythm and commitment is what makes Scrum feel structured compared to more fluid approaches, providing guardrails that help teams new to Agile or those needing coordination across multiple groups. Scrum's iterative nature aligns perfectly with MVP development—each sprint delivers a potentially shippable increment, allowing teams to build, measure, and learn in short cycles, validating assumptions before investing heavily in the *wrong direction*.


!!!anote "💡 MVP in Scrum Context"
    **Minimum Viable Product (MVP)** is the smallest version of a product that delivers value and enables learning. In Scrum, each sprint can deliver a mini-MVP—a working increment that tests assumptions and gathers feedback. Rather than building everything upfront, teams use sprints to validate ideas incrementally, pivoting or persevering based on what they learn. This approach minimizes waste by ensuring you're building the right thing before committing to full development.

**Scrum Core Elements**

!!!anote "⏱️ Time-Boxing"
    - Fixed sprint length (typically 2 weeks)
    - Sprint starts with planning
    - Sprint ends with review and retrospective
    - Rhythm creates predictability

Time-boxing forces decisions and prevents endless deliberation. Without a deadline, teams can spend weeks perfecting features that users don't need. The fixed sprint length creates urgency—you have two weeks to deliver something valuable, so you focus on what matters most. This constraint breeds creativity and prioritization. Teams learn to break work into sprint-sized chunks, which naturally leads to incremental delivery. The predictable rhythm also helps stakeholders plan around your releases, building trust through consistency.

Scrum's time-boxes enable powerful predictability tools like burndown charts, which show remaining work versus time, making it obvious whether the team will finish on schedule. When a burndown chart trends upward instead of down, the team knows immediately they're in trouble and can adjust. Velocity—the average story points completed per sprint—emerges from this rhythm, allowing teams to forecast how many sprints a feature will take. This predictability transforms vague promises into concrete commitments stakeholders can rely on.

{% echarts %}
{
  "title": {
    "text": "Sprint Burndown Chart Example"
  },
  "tooltip": {
    "trigger": "axis"
  },
  "legend": {
    "data": ["Ideal Burndown", "Actual Progress"]
  },
  "xAxis": {
    "type": "category",
    "data": ["Day 1", "Day 2", "Day 3", "Day 4", "Day 5", "Day 6", "Day 7", "Day 8", "Day 9", "Day 10"]
  },
  "yAxis": {
    "type": "value",
    "name": "Story Points Remaining"
  },
  "series": [
    {
      "name": "Ideal Burndown",
      "type": "line",
      "data": [50, 45, 40, 35, 30, 25, 20, 15, 10, 5, 0],
      "itemStyle": {
        "color": "#91cc75"
      },
      "lineStyle": {
        "type": "dashed"
      }
    },
    {
      "name": "Actual Progress",
      "type": "line",
      "data": [50, 48, 42, 38, 35, 28, 22, 18, 12, 5, 0],
      "itemStyle": {
        "color": "#5470c6"
      }
    }
  ]
}
{% endecharts %}

This burndown chart shows a healthy sprint where actual progress (solid blue line) tracks close to the ideal burndown (dashed green line). The team started with 50 story points and steadily completed work each day. If the actual line had trended upward or flatlined, it would signal problems—scope creep, blocked work, or underestimated complexity. The visual makes sprint health obvious at a glance, enabling early intervention when things go off track.

!!!anote "🤝 Commitment"
    - Team commits to sprint scope
    - Scope frozen during sprint
    - Focus on completing committed work
    - Velocity emerges from completed work

Commitment creates focus by protecting the team from constant interruptions. When the team commits to a sprint scope, they're saying "we'll finish this, and we need you to let us focus." This social contract prevents the chaos of constantly shifting priorities mid-sprint. The frozen scope isn't about rigidity—it's about giving the team space to do deep work without context switching. Over time, completed commitments build velocity data, which enables realistic planning. Teams that honor their commitments build credibility with stakeholders, earning the autonomy to work effectively.

!!!anote "👥 Roles"
    - Product Owner: Prioritizes backlog
    - Scrum Master: Facilitates process
    - Development Team: Delivers work

Clear roles prevent confusion about who decides what. The Product Owner owns the "what"—which features matter most and why. The Development Team owns the "how"—technical decisions and implementation. The Scrum Master owns the "how we work"—facilitating ceremonies and removing obstacles. This separation prevents the common dysfunction where everyone has opinions about everything but no one has clear authority. When roles blur, teams waste time in endless debates. When roles are clear, decisions happen quickly and work flows smoothly.

!!!anote "🎭 Ceremonies"
    - Sprint Planning: Select work for sprint
    - Daily Standup: Synchronize team
    - Sprint Review: Demo completed work
    - Sprint Retrospective: Improve process

Ceremonies provide structure for communication without requiring constant meetings. Sprint Planning aligns the team on goals before work begins, preventing wasted effort. Daily Standups catch problems early when they're still small—a 15-minute sync can prevent days of rework. Sprint Reviews create feedback loops with stakeholders, ensuring you're building the right thing. Retrospectives turn experience into improvement, making each sprint better than the last. These ceremonies aren't bureaucracy—they're investments that save far more time than they cost by preventing miscommunication and misalignment.

### Kanban: Flow and Flexibility

Kanban focuses on visualizing work and optimizing flow:

!!!anote "👁️ Visualization"
    - Board shows all work
    - Columns represent workflow stages
    - Cards move through stages
    - Bottlenecks become visible

Visualization makes invisible work visible, transforming abstract tasks into tangible cards everyone can see. When all work appears on a shared board, hidden bottlenecks become obvious—you can literally see where cards pile up. This transparency prevents the common problem where everyone is busy but nothing gets finished. Team members can glance at the board and understand the current state without status meetings. Visualization also creates shared ownership—the board belongs to the team, not management, making it a tool for coordination rather than surveillance.

!!!anote "🚦 Work-in-Progress Limits"
    - Maximum items per stage
    - Prevents overload
    - Forces completion before starting new work
    - Improves flow

WIP limits are Kanban's secret weapon against the multitasking trap. By capping how many items can be in progress simultaneously, WIP limits force teams to finish work before starting new work. This constraint feels uncomfortable at first—developers hate being blocked—but it exposes systemic problems that multitasking masks. When you can't start new work because you've hit your WIP limit, you're forced to help finish existing work or fix the bottleneck causing the backup. This collaboration improves flow and reduces cycle time far more than everyone working on separate tasks ever could.

!!!anote "🌊 Flow Management"
    - No fixed iterations
    - Work pulled when capacity available
    - Continuous delivery
    - Optimize cycle time

Flow management prioritizes throughput over batching. Without sprint boundaries, work flows continuously from backlog to done, getting deployed as soon as it's ready. This pull-based system means work starts when the team has capacity, not when a sprint begins. Teams measure cycle time—how long from start to finish—and optimize for speed. This approach aligns perfectly with continuous deployment, where the goal is getting value to users as quickly as possible. Flow management also handles variable work sizes naturally—small fixes don't wait for sprint planning, and large features don't artificially squeeze into sprint boundaries.

!!!anote "📈 Continuous Improvement"
    - Measure and optimize flow
    - Identify bottlenecks
    - Experiment with process changes
    - Evolve based on data

Continuous improvement in Kanban is data-driven rather than ceremony-driven. Teams measure cycle time, throughput, and flow efficiency, using metrics to identify where the process breaks down. When data shows testing is a bottleneck, the team experiments with solutions—adding testers, automating tests, or shifting testing left. These experiments are small and reversible, making improvement low-risk. Unlike retrospectives that happen every two weeks, Kanban improvement is ongoing—when you spot a problem, you fix it immediately. This evolutionary approach means the process constantly adapts to changing conditions without waiting for scheduled improvement sessions.

### The Philosophical Difference

The frameworks embody different philosophies:

!!!tip "🎯 Core Philosophy"
    **Scrum: Predictability Through Rhythm**
    - Regular cadence creates stability
    - Commitment drives completion
    - Ceremonies ensure coordination
    - Velocity enables planning
    - Best for: Predictable delivery schedules
    
    **Kanban: Efficiency Through Flow**
    - Continuous flow maximizes throughput
    - WIP limits prevent waste
    - Metrics drive optimization
    - Flexibility enables responsiveness
    - Best for: Unpredictable work arrival

Neither philosophy is inherently better. They optimize for different outcomes. Scrum optimizes for predictability and team coordination. Kanban optimizes for flow and responsiveness.

## When Scrum Works Best

Scrum excels in specific contexts. Understanding these contexts helps you decide if Scrum fits your situation.

### Product Development Teams

Teams building products benefit from Scrum's structure:

!!!success "✅ Scrum Strengths for Product Teams"
    **Clear Planning Cycles**
    - Sprint planning aligns team on goals
    - Product owner prioritizes features
    - Team estimates and commits
    - Stakeholders know what to expect
    
    **Regular Delivery Rhythm**
    - Demo working software every sprint
    - Gather feedback consistently
    - Iterate based on learning
    - Build trust with stakeholders
    
    **Team Coordination**
    - Daily standups synchronize work
    - Sprint reviews align with stakeholders
    - Retrospectives improve process
    - Shared commitment builds cohesion

A product team building a SaaS platform fits Scrum naturally. Features can be planned in sprints. Stakeholders attend sprint reviews. The team iterates based on feedback. The rhythm creates predictability that helps everyone plan.

### Stable Team Composition

Scrum assumes stable teams:

!!!anote "👥 Team Stability Requirements"
    **Why Stability Matters**
    - Velocity depends on consistent team
    - Ceremonies assume same participants
    - Team dynamics develop over time
    - Estimation accuracy improves with stability
    
    **What Happens Without Stability**
    - Velocity becomes meaningless
    - Ceremonies feel wasteful
    - Team doesn't gel
    - Scrum overhead without benefits

If your team composition changes frequently—contractors rotating in and out, team members shared across projects—Scrum's overhead may not pay off. The framework assumes the team stays together long enough to develop rhythm and improve.

### Need for Predictability

Organizations needing predictable delivery schedules benefit from Scrum:

!!!tip "📅 Predictability Benefits"
    **Stakeholder Management**
    - Sprint reviews provide regular updates
    - Velocity enables forecasting
    - Roadmaps based on sprint capacity
    - Reduces "when will it be done" questions
    
    **Dependency Coordination**
    - Other teams plan around sprint boundaries
    - Integration points at sprint ends
    - Synchronized releases
    - Reduces coordination overhead

If marketing needs to plan campaigns, sales needs to commit to customers, or other teams depend on your deliverables, Scrum's predictability helps. The sprint boundary provides a coordination point.

## When Kanban Works Best

Kanban excels in different contexts. Recognizing these helps you identify when Kanban fits better than Scrum.

### Support and Maintenance Work

Teams handling support tickets or maintenance benefit from Kanban's flexibility:

!!!success "✅ Kanban Strengths for Support Teams"
    **Unpredictable Work Arrival**
    - Tickets arrive continuously
    - Priorities change based on severity
    - No artificial sprint boundaries
    - Respond immediately to urgent issues
    
    **Variable Work Size**
    - Some tickets take minutes
    - Others take days
    - No need to estimate everything
    - Focus on completing work, not planning
    
    **Continuous Delivery**
    - Fix deployed as soon as ready
    - No waiting for sprint end
    - Faster resolution for customers
    - Reduced work-in-progress

A support team can't plan two weeks of work in advance. Urgent issues arrive unpredictably. Kanban's pull system handles this naturally. Work gets done when capacity is available, without artificial sprint boundaries.

### Continuous Deployment Environments

Teams deploying multiple times daily benefit from Kanban:

!!!anote "🚀 Continuous Deployment Fit"
    **No Sprint Boundaries**
    - Deploy whenever feature is ready
    - No waiting for sprint end
    - Faster time to market
    - Reduced batch size
    
    **Flow Optimization**
    - Measure cycle time
    - Identify bottlenecks
    - Optimize deployment pipeline
    - Continuous improvement
    
    **Feature Flags**
    - Deploy incomplete features
    - Enable when ready
    - Decouple deployment from release
    - Kanban's flexibility enables this

If you're deploying to production multiple times per day, sprint boundaries feel artificial. Why wait for sprint end to release a completed feature? Kanban's continuous flow aligns better with continuous deployment.

### Highly Variable Priorities

When priorities change frequently, Kanban's flexibility helps:

!!!tip "🔀 Handling Priority Changes"
    **No Sprint Commitment**
    - Reprioritize anytime
    - Pull highest priority work next
    - No "wait until next sprint"
    - Respond to market changes quickly
    
    **Reduced Planning Overhead**
    - No sprint planning ceremony
    - Just-in-time prioritization
    - Less time in meetings
    - More time delivering value

If your product manager changes priorities daily based on customer feedback or market conditions, Scrum's sprint commitment becomes a constraint. Kanban lets you pivot immediately without breaking commitments.

## The Hybrid Approach: Scrumban

Many teams combine Scrum and Kanban elements, creating Scrumban:

### What Scrumban Looks Like

Scrumban takes the best of both frameworks:

!!!anote "🔀 Scrumban Elements"
    **From Scrum**
    - Sprint planning for coordination
    - Daily standups for synchronization
    - Retrospectives for improvement
    - Optional sprint reviews
    
    **From Kanban**
    - Kanban board for visualization
    - WIP limits to prevent overload
    - Continuous delivery within sprint
    - Flow metrics for optimization
    
    **The Combination**
    - Plan work in sprints
    - Manage flow with Kanban
    - Deploy continuously
    - Review and improve regularly

Scrumban provides structure without rigidity. You get Scrum's coordination benefits and Kanban's flow optimization.

### When Scrumban Makes Sense

Scrumban works well in specific situations:

!!!success "✅ Scrumban Sweet Spots"
    **Transitioning from Scrum**
    - Team comfortable with Scrum
    - Want more flexibility
    - Keep ceremonies, add flow management
    - Gradual evolution
    
    **Mixed Work Types**
    - Planned feature development
    - Unplanned support work
    - Sprints for features
    - Kanban for support
    
    **Mature Teams**
    - Understand both frameworks
    - Can handle complexity
    - Want optimization
    - Don't need strict structure

A team building features while handling production support might use Scrumban. Sprint planning for features, Kanban board for all work, WIP limits to prevent overload, continuous deployment when ready.

### Scrumban Anti-Patterns

Combining frameworks can create problems:

!!!error "🚫 Scrumban Pitfalls"
    **Complexity Overload**
    - Too many rules from both frameworks
    - Team confused about process
    - Overhead without benefits
    - Simpler approach would work better
    
    **Cherry-Picking Without Understanding**
    - Taking ceremonies without principles
    - Cargo cult Scrumban
    - Missing the point of both frameworks
    - Creating bureaucracy
    
    **Avoiding Commitment**
    - Using Kanban flexibility to avoid planning
    - No sprint goals or focus
    - Losing Scrum's benefits
    - Not gaining Kanban's either

Don't combine frameworks just because you can. Understand why you're taking elements from each. If you can't articulate the benefit, you're probably adding complexity without value.

## Common Mistakes with Both Frameworks

Teams make predictable mistakes with both Scrum and Kanban:

### Scrum Mistakes

Scrum's structure can be misused:

!!!error "🚫 Scrum Anti-Patterns"
    **Sprint as Mini-Waterfall**
    - Design sprint, then coding sprint, then testing sprint
    - No working software until multiple sprints
    - Missing iterative development point
    - Waterfall with shorter phases
    
    **Velocity as Performance Metric**
    - Management tracks velocity
    - Teams inflate estimates
    - Gaming the system
    - Velocity becomes meaningless
    
    **Rigid Sprint Commitment**
    - Can't change anything mid-sprint
    - Even when priorities shift dramatically
    - Process over outcomes
    - Losing agility
    
    **Ceremony Theater**
    - Going through motions without purpose
    - Standups as status reports
    - Retrospectives without action
    - Meetings for meetings' sake

These mistakes turn Scrum into bureaucracy. The framework becomes the goal instead of a tool for delivering value.

### Kanban Mistakes

Kanban's flexibility can be misused:

!!!error "🚫 Kanban Anti-Patterns"
    **No WIP Limits**
    - Board shows all work
    - But no limits on work-in-progress
    - Team overloaded
    - Missing Kanban's core benefit
    
    **Lack of Prioritization**
    - Everything on the board
    - No clear priorities
    - Team picks randomly
    - Flexibility becomes chaos
    
    **No Flow Metrics**
    - Using Kanban board
    - But not measuring cycle time
    - Can't identify bottlenecks
    - Missing improvement opportunities
    
    **Avoiding Planning**
    - "We're Kanban, we don't plan"
    - No strategic direction
    - Reactive instead of proactive
    - Flexibility as excuse for lack of vision

These mistakes turn Kanban into chaos. The flexibility becomes an excuse for lack of discipline.

## Making the Choice

How do you decide between Scrum and Kanban? Ask these questions:

### Decision Framework

Use this framework to guide your choice:

!!!tip "🎯 Decision Questions"
    **Choose Scrum If:**
    - Team is new to Agile (structure helps)
    - Stakeholders need predictability
    - Team composition is stable
    - Work can be planned in iterations
    - Product development focus
    - Need coordination with other teams
    
    **Choose Kanban If:**
    - Work arrives unpredictably
    - Priorities change frequently
    - Team does support/maintenance
    - Continuous deployment environment
    - Team experienced with Agile
    - Want to optimize flow
    
    **Choose Scrumban If:**
    - Mixed work types (planned + unplanned)
    - Want structure with flexibility
    - Team comfortable with both frameworks
    - Transitioning from Scrum to more flow
    - Need coordination but also responsiveness

No framework is perfect for every situation. Choose based on your context, not dogma.

### Experimentation Over Dogma

The best approach: experiment and adapt:

!!!success "✅ Experimental Mindset"
    **Start Simple**
    - Pick one framework
    - Implement core practices
    - Don't add complexity
    - Learn what works
    
    **Measure Outcomes**
    - Delivery frequency
    - Cycle time
    - Team satisfaction
    - Customer satisfaction
    
    **Adapt Based on Learning**
    - What's working? Keep it
    - What's not? Change it
    - Don't be dogmatic
    - Framework serves team, not vice versa
    
    **Evolve Continuously**
    - Retrospectives drive changes
    - Try improvements
    - Keep what helps
    - Discard what doesn't

The goal isn't perfect adherence to a framework. The goal is delivering value effectively. Use the framework as a starting point, then adapt based on what you learn.

## Real-World Examples

Seeing how teams actually use these frameworks clarifies the differences:

### Scrum Success: Product Team

A product team building a mobile app used Scrum effectively:

!!!anote "📱 Mobile App Team"
    **Context**
    - 6 developers, 1 designer, 1 product manager
    - Building consumer mobile app
    - Competitive market, need regular releases
    - Stakeholders want predictability
    
    **Scrum Implementation**
    - 2-week sprints
    - Sprint planning: half day
    - Daily standups: 15 minutes
    - Sprint review: demo to company
    - Sprint retrospective: 1 hour
    - Deploy to app stores at sprint end
    
    **Why It Worked**
    - Stable team composition
    - Work could be planned in sprints
    - Stakeholders attended sprint reviews
    - Regular releases built trust
    - Velocity enabled roadmap planning

The team delivered predictably. Stakeholders knew what to expect. The rhythm created stability that helped everyone plan. Scrum's structure was an asset, not overhead.

### Kanban Success: Support Team

A support team handling customer issues used Kanban effectively:

!!!anote "🎫 Customer Support Team"
    **Context**
    - 4 engineers handling production issues
    - Tickets arrive unpredictably
    - Severity ranges from minor to critical
    - Need fast response times
    
    **Kanban Implementation**
    - Board: Backlog → In Progress → Review → Done
    - WIP limit: 2 items per person
    - Priority: Severity-based
    - Deploy fixes immediately when ready
    - Weekly retrospectives
    
    **Why It Worked**
    - Unpredictable work arrival
    - Variable work size
    - No artificial sprint boundaries
    - Fast response to urgent issues
    - Continuous improvement through metrics

The team responded quickly to issues. No waiting for sprint boundaries. WIP limits prevented overload. Flow metrics identified bottlenecks. Kanban's flexibility was essential.

### Scrumban Success: Platform Team

A platform team supporting product teams used Scrumban:

!!!anote "🛠️ Platform Team"
    **Context**
    - 5 engineers building internal tools
    - Planned feature development
    - Unplanned support requests
    - Need both predictability and responsiveness
    
    **Scrumban Implementation**
    - 2-week sprints for planning
    - Kanban board for all work
    - WIP limits: 3 items in progress
    - Deploy continuously
    - Sprint reviews and retrospectives
    
    **Why It Worked**
    - Sprint planning for feature coordination
    - Kanban flexibility for support requests
    - WIP limits prevented overload
    - Continuous deployment for fast delivery
    - Best of both frameworks

The team planned features in sprints but handled support requests immediately. The combination provided structure without rigidity.

## Conclusion

Scrum and Kanban aren't competing frameworks—they're tools for different contexts. Scrum provides structure through time-boxed iterations, defined roles, and regular ceremonies. This structure helps teams new to Agile, teams needing predictability, and teams building products with stable composition.

Kanban provides flexibility through continuous flow, WIP limits, and visual management. This flexibility helps teams handling unpredictable work, teams deploying continuously, and teams needing to respond quickly to changing priorities.

Neither framework is universally superior. Scrum excels when you need predictability and coordination. Kanban excels when you need flexibility and flow optimization. Scrumban combines elements when you need both.

Common mistakes with Scrum include treating sprints as mini-waterfalls, using velocity as a performance metric, and performing ceremonies without purpose. Common mistakes with Kanban include skipping WIP limits, avoiding prioritization, and using flexibility as an excuse for lack of planning.

The decision between frameworks depends on your context. Ask whether your work is predictable or unpredictable, whether your team is stable or changing, whether you need coordination or responsiveness. Use these answers to guide your choice, not dogma about which framework is "more Agile."

The best approach is experimental. Start with one framework, implement core practices, measure outcomes, and adapt based on learning. The framework should serve your team, not the other way around. If something isn't working, change it. If something helps, keep it.

Real-world examples show both frameworks succeeding in appropriate contexts. A product team used Scrum for predictable delivery. A support team used Kanban for responsive service. A platform team used Scrumban for mixed work types. Each chose based on their specific situation.

Before choosing a framework, understand your context. What kind of work do you do? How predictable is it? How stable is your team? What do stakeholders need? The answers to these questions matter more than opinions about which framework is better.

The goal isn't perfect adherence to Scrum or Kanban. The goal is delivering value effectively. Use frameworks as starting points, then adapt based on what works for your team. Agility means adapting your process, not following someone else's prescription.

Whether you choose Scrum, Kanban, or Scrumban, remember: the framework is a tool, not a goal. Focus on outcomes—delivering value to customers, improving team effectiveness, responding to change. If the framework helps achieve these outcomes, keep using it. If it doesn't, change it. That's what being Agile actually means.
