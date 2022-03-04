import { ContextPlugin } from "@webiny/handler";
import { CmsContext } from "~/types";

export default () => {
    return new ContextPlugin<CmsContext>(context => {
        const locale = context.i18nContent.getCurrentLocale();

        context.cms = {
            ...(context.cms || ({} as any)),
            locale: locale ? locale.code : "en-US",
            getLocale() {
                if (!locale) {
                    return {
                        code: "en-US",
                        default: true
                    };
                }
                return locale;
            }
        };
    });
};
