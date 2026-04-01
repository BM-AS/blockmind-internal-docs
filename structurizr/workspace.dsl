workspace "BlockMind" "Internal architecture model" {

    model {
        user = person "User" "BlockMind platform user"
        philip = person "Philip" "CTO"
        trym = person "Trym" "Full stack dev"

        planetscale = softwareSystem "PlanetScale" "Postgres database" "External"
        fly = softwareSystem "Fly.io" "Agent compute (Fly Machines)" "External"
        vercel = softwareSystem "Vercel" "Platform hosting + serverless" "External"
        inngest = softwareSystem "Inngest" "Durable workflow orchestration" "External"
        browserbase = softwareSystem "Browserbase" "Cloud browser for agents" "External"
        tigris = softwareSystem "Tigris S3" "Artifact storage" "External"
        moralis = softwareSystem "Moralis" "Blockchain data" "External"

        platform = softwareSystem "BlockMind Platform" "DeFi portfolio tracking + AI agents" {
            webapp = container "Web App" "TanStack Start + Vite" "TypeScript"
            api = container "API Layer" "oRPC routes" "TypeScript"
            auth = container "Auth" "Better Auth" "TypeScript"
            db = container "Database" "Drizzle ORM → PlanetScale" "Postgres"
            electricSync = container "Electric SQL" "Durable Streams + Postgres Sync" "TypeScript"
            creditSystem = container "Credit System" "Usage metering + billing" "TypeScript"
        }

        elite = softwareSystem "Elite Agent System" "Per-user AI agents on Fly Machines" {
            gateway = container "OpenClaw Gateway" "Agent runtime per user" "TypeScript"
            agentConfig = container "Agent Config" "Skills, tools, persona" "YAML/JSON"
            relay = container "Event Relay" "SSE bridge: agent → platform" "TypeScript"
            browserTool = container "Browser Tool" "Browserbase integration" "TypeScript"
            fileSystem = container "Agent File System" "Persistent volume on Fly" "Fly Volume"
        }

        agentInfra = softwareSystem "Agent Infrastructure" "Provisioning + lifecycle" {
            provisioner = container "Provisioner" "Inngest functions for machine lifecycle" "TypeScript"
            templateSync = container "Template Sync" "Config + skill distribution" "TypeScript"
            healthMonitor = container "Health Monitor" "Machine status tracking" "TypeScript"
        }

        user -> platform "Uses"
        platform -> elite "Provisions + communicates with"
        elite -> fly "Runs on"
        platform -> vercel "Deployed on"
        platform -> planetscale "Stores data in"
        platform -> inngest "Schedules workflows via"
        elite -> browserbase "Browses via"
        elite -> tigris "Stores artifacts in"
        agentInfra -> fly "Manages machines on"
        agentInfra -> inngest "Orchestrated by"
        platform -> moralis "Fetches chain data from"

        webapp -> api "Calls"
        api -> auth "Authenticates via"
        api -> db "Queries"
        webapp -> electricSync "Subscribes to"
        electricSync -> db "Syncs from"
        api -> creditSystem "Meters usage via"

        gateway -> relay "Emits events to"
        relay -> electricSync "Pushes to"
        gateway -> browserTool "Browses via"
        gateway -> fileSystem "Reads/writes"

        provisioner -> templateSync "Triggers"
        provisioner -> healthMonitor "Reports to"
    }

    views {
        systemLandscape "SystemLandscape" "BlockMind system landscape" {
            include *
            autoLayout
        }

        systemContext platform "PlatformContext" "Platform in context" {
            include *
            autoLayout
        }

        systemContext elite "EliteContext" "Elite agent system in context" {
            include *
            autoLayout
        }

        container platform "PlatformContainers" "Platform internals" {
            include *
            autoLayout
        }

        container elite "EliteContainers" "Elite agent internals" {
            include *
            autoLayout
        }

        container agentInfra "AgentInfraContainers" "Agent infrastructure internals" {
            include *
            autoLayout
        }

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
        }
    }
}
