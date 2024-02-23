import { AcoContext } from "~/types";
import { createWhere } from "./where";
import { ROOT_FOLDER } from "./constants";
import { filterEntriesByFolderFactory } from "./filterEntriesByFolderFactory";
import { createFolderType } from "./createFolderType";
import { CmsModel } from "@webiny/api-headless-cms/types";

type Context = Pick<AcoContext, "aco" | "cms">;

interface EntryManagerCrudDecoratorsParams {
    context: Context;
}

export class CmsEntriesCrudDecorators {
    private readonly context: Context;

    public constructor({ context }: EntryManagerCrudDecoratorsParams) {
        this.context = context;
    }

    public decorate() {
        const context = this.context;
        const folderLevelPermissions = context.aco.folderLevelPermissions;

        const filterEntriesByFolder = filterEntriesByFolderFactory(context, folderLevelPermissions);

        const modelAuthorizationDisabled = (model: CmsModel) => {
            if (typeof model.authorization === "object") {
                return model?.authorization?.flp === false;
            }

            return model.authorization === false;
        };

        const originalCmsListEntries = context.cms.listEntries.bind(context.cms);
        context.cms.listEntries = async (...allParams) => {
            const [model, params] = allParams;
            if (modelAuthorizationDisabled(model)) {
                return originalCmsListEntries(...allParams);
            }

            const folderType = createFolderType(model);
            const folders = await folderLevelPermissions.listAllFoldersWithPermissions(folderType);

            const where = createWhere({
                model,
                where: params.where,
                folders
            });
            return originalCmsListEntries(model, {
                ...params,
                where
            });
        };

        const originalCmsGetEntry = context.cms.getEntry.bind(context.cms);
        context.cms.getEntry = async (...allParams) => {
            const [model, params] = allParams;
            if (modelAuthorizationDisabled(model)) {
                return originalCmsGetEntry(...allParams);
            }

            const entry = await originalCmsGetEntry(model, params);

            const folderId = entry?.location?.folderId;
            if (!folderId || folderId === ROOT_FOLDER) {
                return entry;
            }

            const folder = await context.aco.folder.get(folderId);
            await folderLevelPermissions.ensureCanAccessFolderContent({
                folder,
                rwd: "r"
            });

            return entry;
        };

        const originalCmsGetEntryById = context.cms.getEntryById.bind(context.cms);
        context.cms.getEntryById = async (...allParams) => {
            const [model, params] = allParams;
            if (modelAuthorizationDisabled(model)) {
                return originalCmsGetEntryById(...allParams);
            }

            const entry = await originalCmsGetEntryById(model, params);

            const folderId = entry?.location?.folderId;
            if (!folderId || folderId === ROOT_FOLDER) {
                return entry;
            }
            const folder = await context.aco.folder.get(folderId);
            await folderLevelPermissions.ensureCanAccessFolderContent({
                folder,
                rwd: "r"
            });
            return entry;
        };

        const originalGetLatestEntriesByIds = context.cms.getLatestEntriesByIds.bind(context.cms);
        context.cms.getLatestEntriesByIds = async (...allParams) => {
            const [model, ids] = allParams;
            if (modelAuthorizationDisabled(model)) {
                return originalGetLatestEntriesByIds(...allParams);
            }

            const entries = await originalGetLatestEntriesByIds(model, ids);

            return filterEntriesByFolder(model, entries);
        };

        const originalGetPublishedEntriesByIds = context.cms.getPublishedEntriesByIds.bind(
            context.cms
        );
        context.cms.getPublishedEntriesByIds = async (...allParams) => {
            const [model, ids] = allParams;
            if (modelAuthorizationDisabled(model)) {
                return originalGetPublishedEntriesByIds(...allParams);
            }

            const entries = await originalGetPublishedEntriesByIds(model, ids);
            return filterEntriesByFolder(model, entries);
        };

        const originalCmsCreateEntry = context.cms.createEntry.bind(context.cms);
        context.cms.createEntry = async (...allParams) => {
            const [model, params, options] = allParams;
            if (modelAuthorizationDisabled(model)) {
                return originalCmsCreateEntry(...allParams);
            }

            const folderId = params.wbyAco_location?.folderId || params.location?.folderId;

            if (!folderId || folderId === ROOT_FOLDER) {
                return originalCmsCreateEntry(model, params, options);
            }

            const folder = await context.aco.folder.get(folderId);
            await folderLevelPermissions.ensureCanAccessFolderContent({
                folder,
                rwd: "w"
            });

            return originalCmsCreateEntry(model, params, options);
        };

        const originalCmsCreateFromEntry = context.cms.createEntryRevisionFrom.bind(context.cms);
        context.cms.createEntryRevisionFrom = async (...allParams) => {
            const [model, id, input, options] = allParams;
            if (modelAuthorizationDisabled(model)) {
                return originalCmsCreateFromEntry(...allParams);
            }

            const entry = await context.cms.storageOperations.entries.getRevisionById(model, {
                id
            });

            const folderId = entry?.location?.folderId;
            if (!folderId || folderId === ROOT_FOLDER) {
                return originalCmsCreateFromEntry(model, id, input, options);
            }

            const folder = await context.aco.folder.get(folderId);
            await folderLevelPermissions.ensureCanAccessFolderContent({
                folder,
                rwd: "w"
            });

            return originalCmsCreateFromEntry(model, id, input, options);
        };

        const originalCmsUpdateEntry = context.cms.updateEntry.bind(context.cms);
        context.cms.updateEntry = async (...allParams) => {
            const [model, id, input, meta, options] = allParams;
            if (modelAuthorizationDisabled(model)) {
                return originalCmsUpdateEntry(...allParams);
            }

            const entry = await context.cms.storageOperations.entries.getRevisionById(model, {
                id
            });

            const folderId = entry?.location?.folderId;
            if (!folderId || folderId === ROOT_FOLDER) {
                return originalCmsUpdateEntry(model, id, input, meta, options);
            }

            const folder = await context.aco.folder.get(folderId);
            await folderLevelPermissions.ensureCanAccessFolderContent({
                folder,
                rwd: "w"
            });

            return originalCmsUpdateEntry(model, id, input, meta, options);
        };

        const originalCmsDeleteEntry = context.cms.deleteEntry.bind(context.cms);
        context.cms.deleteEntry = async (...allParams) => {
            const [model, id, options] = allParams;
            if (modelAuthorizationDisabled(model)) {
                return originalCmsDeleteEntry(...allParams);
            }

            const entry = await context.cms.storageOperations.entries.getLatestRevisionByEntryId(
                model,
                {
                    id
                }
            );

            const folderId = entry?.location?.folderId;
            if (!folderId || folderId === ROOT_FOLDER) {
                return originalCmsDeleteEntry(model, id, options);
            }

            const folder = await context.aco.folder.get(folderId);
            await folderLevelPermissions.ensureCanAccessFolderContent({
                folder,
                rwd: "d"
            });

            return originalCmsDeleteEntry(model, id, options);
        };

        const originalCmsDeleteEntryRevision = context.cms.deleteEntryRevision.bind(context.cms);
        context.cms.deleteEntryRevision = async (...allParams) => {
            const [model, id] = allParams;
            if (modelAuthorizationDisabled(model)) {
                return originalCmsDeleteEntryRevision(...allParams);
            }

            const entry = await context.cms.storageOperations.entries.getRevisionById(model, {
                id
            });

            const folderId = entry?.location?.folderId;
            if (!folderId || folderId === ROOT_FOLDER) {
                return originalCmsDeleteEntryRevision(model, id);
            }

            const folder = await context.aco.folder.get(folderId);
            await folderLevelPermissions.ensureCanAccessFolderContent({
                folder,
                rwd: "d"
            });

            return originalCmsDeleteEntryRevision(model, id);
        };

        const originalCmsMoveEntry = context.cms.moveEntry.bind(context.cms);
        context.cms.moveEntry = async (...allParams) => {
            const [model, id, targetFolderId] = allParams;
            if (modelAuthorizationDisabled(model)) {
                return originalCmsMoveEntry(...allParams);
            }

            /**
             * First we need to check if user has access to the entries existing folder.
             */
            const entry = await context.cms.storageOperations.entries.getRevisionById(model, {
                id
            });

            const folderId = entry?.location?.folderId || ROOT_FOLDER;
            /**
             * If the entry is in the same folder we are trying to move it to, just continue.
             */
            if (folderId === targetFolderId) {
                return originalCmsMoveEntry(model, id, targetFolderId);
            } else if (folderId !== ROOT_FOLDER) {
                /**
                 * If entry current folder is not a root, check for access
                 */
                const folder = await context.aco.folder.get(folderId);
                await folderLevelPermissions.ensureCanAccessFolderContent({
                    folder,
                    rwd: "w"
                });
            }
            /**
             * If target folder is not a ROOT_FOLDER, check for access.
             */
            if (targetFolderId !== ROOT_FOLDER) {
                const folder = await context.aco.folder.get(targetFolderId);
                await folderLevelPermissions.ensureCanAccessFolderContent({
                    folder,
                    rwd: "w"
                });
            }

            return originalCmsMoveEntry(model, id, targetFolderId);
        };
    }
}
