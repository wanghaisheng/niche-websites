import * as fs from "fs";
import * as path from "path";
import fetch from "node-fetch";
import { getWcpApiUrl } from "@webiny/wcp";

export const injectWcpTelemetryClientCode = {
    type: "hook-after-build",
    name: "hook-after-build-inject-wcp-telemetry",
    async hook({ projectApplication }: Record<string, any>) {
        if (!projectApplication.project.config.id) {
            return;
        }

        const workspacePath = projectApplication.paths.workspace;
        const handlersPaths = [
            path.join(workspacePath, "graphql", "build"),
            path.join(workspacePath, "headlessCMS", "build")
        ];

        // 1. Download telemetry client code.
        const latestTelemetryClientUrl = getWcpApiUrl("/clients/latest.js");
        const response = await fetch(latestTelemetryClientUrl);

        const telemetryCodeAsString = await response.text();

        // 2. Wrap the initially built code with the telemetry client code.
        for (let i = 0; i < handlersPaths.length; i++) {
            const current = handlersPaths[i];

            // 2.1 Move initially built `handler.js` into `_handler.js`.
            const builtHandlerPath = path.join(current, "handler.js");
            const renamedHandlerPath = path.join(current, "_handler.js");
            fs.renameSync(builtHandlerPath, renamedHandlerPath);

            // 2.2 Write downloaded telemetry client code as a new `handler.js`.
            fs.writeFileSync(builtHandlerPath, telemetryCodeAsString);
        }
    }
};
