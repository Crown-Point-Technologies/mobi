package org.matonto.dataset.api;

/*-
 * #%L
 * org.matonto.dataset.api
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2017 iNovex Information Systems, Inc.
 * %%
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * #L%
 */

import org.matonto.catalog.api.PaginatedSearchResults;
import org.matonto.dataset.pagination.DatasetPaginatedSearchParams;
import org.matonto.dataset.api.builder.DatasetRecordConfig;
import org.matonto.dataset.ontology.dataset.DatasetRecord;
import org.matonto.rdf.api.Resource;

import java.util.Optional;
import java.util.Set;

/**
 * As service for managing local datasets within the MatOnto platform.
 */
public interface DatasetManager {

    /**
     * Retrieve the Resource for every Dataset in the specified Repository as defined in the local catalog. Note: This
     * method returns the Dataset Resource, not return the DatasetRecord Resource.
     *
     * @param repositoryId The Repository containing the desired datasets.
     * @return The Set of Resources for all the Datasets in the specified Repository as defined in the local catalog.
     */
    Set<Resource> getDatasets(String repositoryId);

    /**
     * Retrieves DatasetRecords in the local catalog based on the passed search and pagination parameters. Acceptable
     * sort properties are http://purl.org/dc/terms/title, http://purl.org/dc/terms/modified, and
     * http://purl.org/dc/terms/issued.
     *
     * @return The PaginatedSearchResults of DatasetRecords in the local catalog. DatasetRecord includes empty Dataset
     *      object.
     */
    PaginatedSearchResults<DatasetRecord> getDatasetRecords(DatasetPaginatedSearchParams searchParams);

    /**
     * Retrieves the DatasetRecord for a dataset in the specified repository.
     *
     * @param dataset The Resource described by the DatasetRecord in the local catalog.
     * @param repositoryId  The Repository containing the specified dataset.
     * @return The DatasetRecord from the local catalog. DatasetRecord includes empty Dataset object.
     */
    Optional<DatasetRecord> getDatasetRecord(Resource dataset, String repositoryId);

    /**
     * Retrieves the DatasetRecord for a dataset described by the specified DatasetRecord Resource.
     *
     * @param record The Resource of the DatasetRecord.
     * @return The DatasetRecord from the local catalog. DatasetRecord includes empty Dataset object.
     */
    Optional<DatasetRecord> getDatasetRecord(Resource record);

    /**
     * Creates a dataset according to the specified configuration. Initial dataset structure is created in the specified
     * repository and the DatasetRecord is added to the local catalog.
     *
     * @param config The DatasetRecordConfig describing the details of the dataset to create.
     * @return The DatasetRecord that has been created in the local catalog. DatasetRecord includes empty Dataset
     * object.
     * @throws IllegalArgumentException if the target dataset repository does not exist.
     * @throws IllegalStateException if the target dataset already exists in the target repository.
     */
    DatasetRecord createDataset(DatasetRecordConfig config);

    /**
     * Deletes the DatasetRecord, Dataset, and data graphs associated with the Dataset Resource. Note: This method
     * removes all graphs from the specified dataset even if they are associated with other datasets.
     *
     * @param dataset The Dataset Resource to be removed along with associated DatasetRecord and data.
     * @throws IllegalArgumentException if the DatasetRecord could not be found in the catalog.
     */
    void deleteDataset(Resource dataset, String repositoryId);

    /**
     * Deletes the DatasetRecord, Dataset, and data graphs associated with the DatasetRecord Resource. Note: This method
     * removes all graphs from the specified dataset even if they are associated with other datasets.
     *
     * @param record The Resource of the DatasetRecord to be removed along with associated Dataset and data.
     * @throws IllegalArgumentException if the DatasetRecord could not be found in the catalog.
     */
    void deleteDataset(Resource record);

    /**
     * Deletes the DatasetRecord, Dataset, and data graphs associated with the Dataset Resource. Note: This method
     * removes all graphs from the specified dataset if and only if they are not associated with other datasets.
     *
     * @param dataset The Dataset Resource to be removed along with associated DatasetRecord and data.
     * @throws IllegalArgumentException if the DatasetRecord could not be found in the catalog.
     */
    void safeDeleteDataset(Resource dataset, String repositoryId);

    /**
     * Deletes the DatasetRecord, Dataset, and data graphs associated with the DatasetRecord Resource. Note: This method
     * removes all graphs from the specified dataset if and only if they are not associated with other datasets.
     *
     * @param record The Resource of DatasetRecord to be removed along with associated Dataset and data.
     * @throws IllegalArgumentException if the DatasetRecord could not be found in the catalog.
     */
    void safeDeleteDataset(Resource record);

    /**
     * Removes all data associated with the Dataset Resource. DatasetRecord and Dataset are not removed. Note:
     * This method removes all graphs from the specified dataset even if they are associated with other datasets.
     *
     * @param dataset The Dataset Resource to be cleared.
     * @throws IllegalArgumentException if the DatasetRecord could not be found in the catalog.
     */
    void clearDataset(Resource dataset, String repositoryId);

    /**
     * Removes all data associated with the Dataset of the DatasetRecord Resource. DatasetRecord and Dataset are not
     * removed. Note: This method removes all graphs from the specified dataset even if they are associated with other datasets.
     *
     * @param record The Resource of the DatasetRecord to be cleared.
     * @throws IllegalArgumentException if the DatasetRecord could not be found in the catalog.
     */
    void clearDataset(Resource record);

    /**
     * Removes all data associated with the Dataset Resource. DatasetRecord and Dataset are not removed. Note:
     * This method removes all graphs from the specified dataset if and only if they are not associated with other
     * datasets.
     *
     * @param dataset The Dataset Resource to be cleared.
     * @throws IllegalArgumentException if the DatasetRecord could not be found in the catalog.
     */
    void safeClearDataset(Resource dataset, String repositoryId);

    /**
     * Removes all data associated with the Dataset of the DatasetRecord Resource. DatasetRecord and Dataset are not
     * removed. Note: This method removes all graphs from the specified dataset if and only if they are not associated with other
     * datasets.
     *
     * @param record The Resource of the DatasetRecord to be cleared.
     * @throws IllegalArgumentException if the DatasetRecord could not be found in the catalog.
     */
    void safeClearDataset(Resource record);
}
