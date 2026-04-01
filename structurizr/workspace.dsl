workspace "BlockMind" "Internal architecture model — C4 Level 1-3" {

    model {
        // People
        user = person "User" "BlockMind platform user"
        philip = person "Philip" "CTO"
        trym = person "Trym" "Full stack dev"

        // External systems
        planetscale = softwareSystem "PlanetScale" "Postgres database (Neon-compatible)" "External"
        fly = softwareSystem "Fly.io" "Agent compute — one Fly Machine per user" "External"
        vercel = softwareSystem "Vercel" "Platform hosting + serverless functions" "External"
        inngest = softwareSystem "Inngest" "Durable workflow orchestration" "External"
        browserbase = softwareSystem "Browserbase" "Cloud browser sessions for agents" "External"
        tigris = softwareSystem "Tigris S3" "Artifact storage (screenshots, files)" "External"
        moralis = softwareSystem "Moralis" "Blockchain data (wallet balances, token prices)" "External"
        electricCloud = softwareSystem "Electric SQL" "Durable Streams cloud service" "External"
        agentmail = softwareSystem "AgentMail" "Agent email pods" "External"

        // ============================================================
        // PLATFORM — the web application on Vercel
        // ============================================================
        platform = softwareSystem "BlockMind Platform" "DeFi portfolio tracking + AI agents" {
            webapp = container "Web App" "TanStack Start SPA with SSR, file-based routing" "TypeScript / React" {
                eliteDashboard = component "Elite Dashboard" "Widget-based dashboard with AccountabilityZone + ActivityZone" "React"
                eliteChat = component "Elite Chat" "Real-time chat UI with streaming tokens, charts, browser events" "React"
                eliteOnboarding = component "Onboarding Flow" "Boot scene animation + provisioning status" "React"
                portfolioViews = component "Portfolio Views" "Holdings, performance, analytics pages" "React"
                strategyForms = component "Strategy Forms" "Risk profile + allocation preferences" "React"
            }

            api = container "API Layer" "Type-safe RPC routes via oRPC" "TypeScript / oRPC" {
                eliteRouter = component "Elite Router" "Chat send, session management, stream bootstrap" "oRPC"
                workspaceRouter = component "Workspace Router" "Provisioning, status, config endpoints" "oRPC"
                agentEventsRouter = component "Agent Events Router" "Ingest endpoint for relay → durable streams" "oRPC"
                chartWidgetRouter = component "Chart Widget Router" "Chart rendering and TradingView data" "oRPC"
                exchangeRouter = component "Exchange Router" "Exchange API key management + sync triggers" "oRPC"
                artifactsRouter = component "Artifacts Router" "Browser artifact upload (S3) + DB record" "oRPC"
            }

            auth = container "Auth" "Session management, OAuth, role-based access" "Better Auth"

            db = container "Database" "Drizzle ORM schema: workspaces, users, orgs, chat_runs, credits" "PlanetScale Postgres" {
                workspacesTable = component "workspaces" "Fly app name, machine ID, status, config JSON, gateway token" "Drizzle"
                eliteChatRuns = component "elite_chat_runs" "Run tracking: runId, status, token count, cost" "Drizzle"
                agentApiKeys = component "agent_api_keys" "Encrypted API keys for agent ↔ platform auth" "Drizzle"
                workspaceEvents = component "workspace_events" "Lifecycle events (provisioned, started, failed)" "Drizzle"
                creditBalances = component "credit_balances" "Per-org credit balance and usage tracking" "Drizzle"
            }

            durableStreams = container "Durable Streams Client" "Electric SQL durable streams — SSE transport for chat events" "TypeScript" {
                dsRuntime = component "DS Runtime" "Dynamically loads @durable-streams/client, manages handles" "TypeScript"
                sseTransport = component "SSE Transport" "useEliteStreamTransport hook — connects to Electric SQL SSE endpoint" "React"
                collections = component "Collections" "8 typed collections: messages, messageEvents, browserEvents, toolUse, toolResult, researchActivity, errors, runLifecycle" "TypeScript / Zod"
                eventRouting = component "Event Routing" "Routes raw durable stream events into typed collections" "TypeScript"
            }

            creditSystem = container "Credit System" "Usage metering: classify model tier, deduct credits per run" "TypeScript" {
                classifier = component "Classifier" "Maps model name → tier (sonnet/opus/flash)" "TypeScript"
                creditService = component "Credit Service" "Deduct, check balance, grant monthly renewal" "TypeScript"
                tierConfig = component "Tier Config" "Credit costs per model tier" "TypeScript"
            }
        }

        // ============================================================
        // ELITE AGENT SYSTEM — per-user Fly Machine
        // ============================================================
        elite = softwareSystem "Elite Agent System" "Per-user AI agents — one Fly Machine per user with OpenClaw runtime" {
            gateway = container "OpenClaw Gateway" "Full agent runtime: LLM orchestration, tool system, memory, conversation" "TypeScript / OpenClaw" {
                conversationEngine = component "Conversation Engine" "Multi-session chat with context management" "OpenClaw"
                toolSystem = component "Tool System" "Extensible tool calls: browse, search, chart, research" "OpenClaw"
                memorySystem = component "Memory System" "MEMORY.md + memory/*.md persistent recall" "OpenClaw"
                skillLoader = component "Skill Loader" "Dynamic skill loading from workspace files" "OpenClaw"
            }

            agentConfig = container "Agent Config" "openclaw.json + SOUL.md + IDENTITY.md + skills/" "YAML/JSON/Markdown" {
                openclawJson = component "openclaw.json" "Agent configuration: model, tools, channels, skills" "JSON"
                soulMd = component "SOUL.md" "Persona definition, tone, behavioral rules" "Markdown"
                identityMd = component "IDENTITY.md" "Agent name, user context, plan tier" "Markdown"
                managedSkills = component "Managed Skills" "Platform-distributed skills (dashboard, research, morning-brief)" "Markdown"
            }

            relay = container "Event Relay" "Node.js script executed on Fly Machine — bridges OpenClaw SSE → platform ingest" "TypeScript" {
                sseConsumer = component "SSE Consumer" "Connects to OpenClaw gateway SSE stream" "TypeScript"
                eventTransformer = component "Event Transformer" "Parses OpenClaw events → typed durable stream events" "TypeScript"
                httpPoster = component "HTTP Poster" "POSTs events to platform /api/agent/events ingest endpoint" "TypeScript"
                heartbeatEmitter = component "Heartbeat Emitter" "Periodic heartbeat events for run liveness" "TypeScript"
            }

            browserTool = container "Browser Tool" "Browserbase integration — cloud browser sessions, screenshot artifacts" "TypeScript"
            fileSystem = container "Agent File System" "Persistent Fly Volume: workspace/, memory/, skills/" "Fly Volume"
        }

        // ============================================================
        // AGENT INFRASTRUCTURE — provisioning + lifecycle
        // ============================================================
        agentInfra = softwareSystem "Agent Infrastructure" "Provisioning, lifecycle management, template distribution" {
            provisioner = container "Provisioner" "Inngest workspace-provisioning function — multi-step durable workflow" "TypeScript / Inngest" {
                createRecord = component "Create Workspace Record" "DB record + org assignment" "Inngest Step"
                claimPool = component "Claim Pool Machine" "Claims pre-warmed Fly Machine from pool or creates fresh" "Inngest Step"
                generateKeys = component "Generate Keys" "API keys + gateway auth token, encrypted storage" "Inngest Step"
                activateWorkspace = component "Activate Workspace" "Marks workspace active, seeds config files on machine" "Inngest Step"
                identitySync = component "Identity Sync" "Writes IDENTITY.md + SOUL.md with user-specific data" "Inngest Step"
                wakeSchedules = component "Wake Schedules" "Creates cron schedules for morning brief, daily pipeline" "Inngest Step"
                agentMailPod = component "AgentMail Pod" "Provisions agent email address" "Inngest Step"
            }

            templateSync = container "Template Sync" "managed-template-sync: distributes skill updates + config patches to all active machines" "TypeScript" {
                goldenManifest = component "Golden Manifest" "Canonical workspace file set (skills, config, templates)" "TypeScript"
                versionTracker = component "Version Tracker" "Tracks MANAGED_TEMPLATE_VERSION per workspace config" "TypeScript"
                fileWriter = component "File Writer" "writeWorkspaceFiles via Fly Machine exec API" "TypeScript"
            }

            healthMonitor = container "Health Monitor" "Machine status tracking + workspace lifecycle transitions" "TypeScript" {
                statusTracker = component "Status Tracker" "Workspace status enum: provisioning → hatching → active → suspended → degraded → failed" "TypeScript"
                machineWaker = component "Machine Waker" "ensureFlyMachineStarted — handles suspend → start lifecycle" "TypeScript"
                gatewayChecker = component "Gateway Checker" "waitForGatewayReady — polls /health on the OpenClaw gateway" "TypeScript"
            }

            runtimeRevisions = container "Runtime Revisions" "Version tracking for agent runtime (OpenClaw image, config schema)" "TypeScript"

            pool = container "Machine Pool" "Pre-warmed Fly Machines for fast provisioning (~200ms claim vs ~30s create)" "TypeScript" {
                poolManager = component "Pool Manager" "Maintains pool of ready machines, handles claims + replenishment" "TypeScript"
                poolMachinesTable = component "pool_machines" "DB table: available pre-warmed machine IDs" "Drizzle"
            }
        }

        // ============================================================
        // RELATIONSHIPS — System Level
        // ============================================================
        user -> platform "Uses web app"
        platform -> elite "Provisions + communicates with agents"
        elite -> fly "Runs on (one machine per user)"
        platform -> vercel "Deployed on"
        platform -> planetscale "Stores data in"
        platform -> inngest "Schedules workflows via"
        elite -> browserbase "Browses web via"
        elite -> tigris "Stores artifacts in"
        agentInfra -> fly "Manages machines on (Fly Machines API)"
        agentInfra -> inngest "Orchestrated by"
        platform -> moralis "Fetches blockchain data from"
        platform -> electricCloud "Durable Streams SSE via"
        agentInfra -> agentmail "Provisions email pods on"

        // ============================================================
        // RELATIONSHIPS — Container Level
        // ============================================================
        // Platform internals
        webapp -> api "Calls (oRPC)"
        api -> auth "Authenticates via"
        api -> db "Queries (Drizzle ORM)"
        webapp -> durableStreams "Subscribes to real-time events"
        durableStreams -> electricCloud "SSE connection to"
        api -> creditSystem "Meters usage via"
        api -> durableStreams "Writes events to durable streams"

        // Elite internals
        gateway -> relay "Emits SSE events to"
        relay -> api "POSTs events to /api/agent/events"
        gateway -> browserTool "Browses via"
        gateway -> fileSystem "Reads/writes workspace files"
        gateway -> agentConfig "Loads configuration from"

        // Agent Infra internals
        provisioner -> pool "Claims machines from"
        provisioner -> templateSync "Triggers initial file seeding"
        templateSync -> elite "Writes files to (via Fly exec API)"
        healthMonitor -> elite "Monitors status of"
        runtimeRevisions -> templateSync "Provides version info to"

        // Cross-system
        eliteRouter -> gateway "Proxies chat messages to (via Fly exec)"
        agentEventsRouter -> durableStreams "Writes inbound relay events to"

        // ============================================================
        // RELATIONSHIPS — Component Level (key flows)
        // ============================================================
        // Chat flow
        eliteChat -> eliteRouter "Sends message"
        eliteRouter -> gateway "Exec on Fly Machine"
        conversationEngine -> toolSystem "Invokes tools"
        sseConsumer -> conversationEngine "Reads SSE stream"
        eventTransformer -> sseConsumer "Parses events from"
        httpPoster -> agentEventsRouter "POSTs typed events"
        agentEventsRouter -> dsRuntime "Appends to durable stream"
        sseTransport -> electricCloud "SSE subscription"
        eventRouting -> collections "Routes into typed collections"
        eliteChat -> collections "Renders from"

        // Provisioning flow
        createRecord -> workspacesTable "Inserts workspace record"
        claimPool -> poolManager "Claims pre-warmed machine"
        generateKeys -> agentApiKeys "Stores encrypted keys"
        activateWorkspace -> fileWriter "Seeds config files"
        identitySync -> fileWriter "Writes IDENTITY.md"
        wakeSchedules -> inngest "Creates cron functions"
        agentMailPod -> agentmail "Creates email pod"

        // Credit flow
        eliteRouter -> classifier "Classifies model tier"
        classifier -> creditService "Deducts credits"
        creditService -> creditBalances "Updates balance"
    }

    views {
        // Level 1: System Landscape
        systemLandscape "SystemLandscape" "All BlockMind systems and external dependencies" {
            include *
            autoLayout
        }

        // Level 2: Container views
        container platform "PlatformContainers" "Platform internals — web app, API, auth, DB, credits, durable streams" {
            include *
            autoLayout
        }

        container elite "EliteContainers" "Elite agent — OpenClaw gateway, relay, browser tool, config, file system" {
            include *
            autoLayout
        }

        container agentInfra "AgentInfraContainers" "Agent infrastructure — provisioning, templates, health, pool" {
            include *
            autoLayout
        }

        // Level 3: Component views
        component webapp "WebAppComponents" "Web app components — dashboard, chat, onboarding, portfolio" {
            include *
            autoLayout
        }

        component api "ApiComponents" "API layer components — oRPC routers" {
            include *
            autoLayout
        }

        component db "DatabaseComponents" "Key database tables" {
            include *
            autoLayout
        }

        component durableStreams "DurableStreamsComponents" "Durable Streams client — runtime, transport, collections, routing" {
            include *
            autoLayout
        }

        component gateway "GatewayComponents" "OpenClaw Gateway internals — conversation, tools, memory, skills" {
            include *
            autoLayout
        }

        component relay "RelayComponents" "Event Relay — SSE consumer, transformer, HTTP poster, heartbeat" {
            include *
            autoLayout
        }

        component provisioner "ProvisionerComponents" "Provisioning workflow steps" {
            include *
            autoLayout
        }

        component templateSync "TemplateSyncComponents" "Template sync — golden manifest, versioning, file writing" {
            include *
            autoLayout
        }

        component pool "PoolComponents" "Machine pool — pre-warmed Fly Machines" {
            include *
            autoLayout
        }

        component creditSystem "CreditSystemComponents" "Credit system — classifier, service, tier config" {
            include *
            autoLayout
        }

        // Styles
        styles {
            element "External" {
                background #999999
                color #ffffff
            }

            element "Person" {
                shape person
                background #08427b
                color #ffffff
            }

            element "Software System" {
                background #1168bd
                color #ffffff
            }

            element "Container" {
                background #438dd5
                color #ffffff
            }

            element "Component" {
                background #85bbf0
                color #000000
            }
        }
    }
}
