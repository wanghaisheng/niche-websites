import { TargetEntity } from "../types";
import mdbid from "mdbid";
import { Targets } from "../entities";
import TargetsResolver from "./TargetsResolver";

/**
 * Contains base `createTarget`, `updateTarget`, and `deleteTarget` GraphQL resolver functions.
 * Feel free to adjust the code to your needs. Also, note that at some point in time, you will
 * most probably want to implement custom data validation and security-related checks.
 * https://www.webiny.com/docs/tutorials
 */

interface CreateTargetParams {
    data: {
        title: string;
        description?: string;
    };
}

interface UpdateTargetParams {
    id: string;
    data: {
        title: string;
        description?: string;
    };
}

interface DeleteTargetParams {
    id: string;
}

interface TargetsMutation {
    createTarget(params: CreateTargetParams): Promise<TargetEntity>;
    updateTarget(params: UpdateTargetParams): Promise<TargetEntity>;
    deleteTarget(params: DeleteTargetParams): Promise<TargetEntity>;
}

/**
 * To define our GraphQL resolvers, we are using the "class method resolvers" approach.
 * https://www.graphql-tools.com/docs/resolvers#class-method-resolvers
 */
export default class TargetMutationResolver extends TargetsResolver implements TargetsMutation {
    /**
     * Creates a new Target entry and responds with it.
     * @param data
     */
    async createTarget({ data }: CreateTargetParams) {
        const { security } = this.context;

        // We use `mdbid` (https://www.npmjs.com/package/mdbid) library to generate
        // a random, unique, and sequential (sortable) ID for our new entry.
        const id = mdbid();

        const target = {
            PK: this.getPK(),
            SK: id,
            id,
            title: data.title,
            description: data.description,
            createdOn: new Date().toISOString(),
            savedOn: new Date().toISOString(),
            createdBy: await security.getIdentity(),
            webinyVersion: process.env.WEBINY_VERSION
        };

        // Will throw an error if something goes wrong.
        await Targets.put(target);

        return target;
    }

    /**
     * Updates an existing Target entry and responds with it.
     * @param id
     * @param data
     */
    async updateTarget({ id, data }: UpdateTargetParams) {
        // If entry is not found, we throw an error.
        const { Item: target } = await Targets.get({ PK: this.getPK(), SK: id });
        if (!target) {
            throw new Error(`Target "${id}" not found.`);
        }

        const updatedTarget = { ...target, ...data };

        // Will throw an error if something goes wrong.
        await Targets.update(updatedTarget);

        return updatedTarget;
    }

    /**
     * Deletes an existing Target entry and responds with it.
     * @param id
     */
    async deleteTarget({ id }: DeleteTargetParams) {
        // If entry is not found, we throw an error.
        const { Item: target } = await Targets.get({ PK: this.getPK(), SK: id });
        if (!target) {
            throw new Error(`Target "${id}" not found.`);
        }

        // Will throw an error if something goes wrong.
        await Targets.delete(target);

        return target;
    }
}
