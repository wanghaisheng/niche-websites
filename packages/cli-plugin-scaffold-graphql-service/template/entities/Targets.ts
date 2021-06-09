// https://github.com/jeremydaly/dynamodb-toolbox
import { Entity } from "dynamodb-toolbox";
import table from "./table";
import { TargetEntity } from "../types";

/**
 * Once we have the table, we define the TargetEntity entity.
 * If needed, additional entities can be defined using the same approach.
 */
export default new Entity<TargetEntity>({
    table,
    name: "Targets",
    created: "createdOn",
    modified: "savedOn",
    attributes: {
        PK: { partitionKey: true },
        SK: { sortKey: true },
        id: { type: "string" },
        title: { type: "string" },
        description: { type: "string" },
        createdOn: { type: "string" },
        savedOn: { type: "string" },
        createdBy: { type: "map" },
        webinyVersion: { type: "string" }
    }
});
