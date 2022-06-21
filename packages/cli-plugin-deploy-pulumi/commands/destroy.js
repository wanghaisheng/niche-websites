const { createPulumiCommand, processHooks } = require("../utils");

module.exports = createPulumiCommand(
    "destroy",
    async ({ inputs, context, projectApplication, pulumi }) => {
        const { env, folder, getDuration } = inputs;

        let stackExists = true;
        try {
            const PULUMI_SECRETS_PROVIDER = process.env.PULUMI_SECRETS_PROVIDER;
            const PULUMI_CONFIG_PASSPHRASE = process.env.PULUMI_CONFIG_PASSPHRASE;

            await pulumi.run({
                command: ["stack", "select", env],
                args: {
                    secretsProvider: PULUMI_SECRETS_PROVIDER
                },
                execa: {
                    env: {
                        PULUMI_CONFIG_PASSPHRASE
                    }
                }
            });
        } catch (e) {
            stackExists = false;
        }

        if (!stackExists) {
            context.error(
                `Project application ${context.error.hl(folder)} (${context.error.hl(
                    env
                )} environment) does not exist.`
            );
            return;
        }

        const hooksParams = { context, env, projectApplication };

        await processHooks("hook-before-destroy", hooksParams);

        await pulumi.run({
            command: "destroy",
            args: {
                debug: inputs.debug,
                yes: true
            },
            execa: {
                stdio: "inherit",
                env: {
                    WEBINY_ENV: env,
                    WEBINY_PROJECT_NAME: context.project.name
                }
            }
        });

        console.log();

        const duration = getDuration();
        context.success(`Done! Destroy finished in ${context.success.hl(duration + "s")}.`);

        await processHooks("hook-after-destroy", hooksParams);
    }
);
