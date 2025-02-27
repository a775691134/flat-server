import { initializeDataSource } from "../../../../__tests__/helpers/db/test-hooks";
import test from "ava";
import { HelperAPI } from "../../../../__tests__/helpers/api";
import { v4 } from "uuid";
import { cloudStorageRouters } from "../../routes";
import { cloudStorageDirectoryCreate } from "../";
import { successJSON } from "../../../internal/utils/response-json";
import { cloudStorageFilesDAO, cloudStorageUserFilesDAO } from "../../../../dao";
import { useTransaction } from "../../../../__tests__/helpers/db/query-runner";
import { FileResourceType } from "../../../../../model/cloudStorage/Constants";

const namespace = "v2.controllers.cloud-storage.directory.create";

initializeDataSource(test, namespace);

test(`${namespace} - create success`, async ava => {
    const { t } = await useTransaction();
    const helperAPI = new HelperAPI();
    const [userUUID, directoryName] = [v4(), v4()];

    await helperAPI.import(cloudStorageRouters, cloudStorageDirectoryCreate);
    const resp = await helperAPI.injectAuth(userUUID, {
        method: "POST",
        url: "/v2/cloud-storage/create-directory",
        payload: {
            parentDirectoryPath: "/",
            directoryName,
        },
    });

    ava.is(resp.statusCode, 200);
    ava.deepEqual(resp.json(), successJSON({}));

    const { file_uuid } = await cloudStorageUserFilesDAO.findOne(t, "file_uuid", {
        user_uuid: userUUID,
    });

    const result = await cloudStorageFilesDAO.findOne(
        t,
        ["directory_path", "file_name", "resource_type"],
        {
            file_uuid,
        },
    );

    ava.is(result.directory_path, "/");
    ava.is(result.file_name, directoryName);
    ava.is(result.resource_type, FileResourceType.Directory);
});
