package org.matonto.clustering.cli;

/*-
 * #%L
 * org.matonto.clustering.cli
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 iNovex Information Systems, Inc.
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
import static org.apache.commons.lang3.StringUtils.isBlank;

import org.apache.karaf.shell.api.action.Action;
import org.apache.karaf.shell.api.action.Argument;
import org.apache.karaf.shell.api.action.Command;
import org.apache.karaf.shell.api.action.Option;
import org.apache.karaf.shell.api.action.lifecycle.Reference;
import org.apache.karaf.shell.api.action.lifecycle.Service;
import org.matonto.clustering.api.ClusteringService;

import java.util.List;

/**
 *
 * @author Sean Smitz <sean.smitz@inovexcorp.com>
 */
@Command(scope = "matonto", name = "fedsvc", description = "View information about the federated services.")
@Service
public class ClusteringServiceCli implements Action {
    public final static String VIEW_OPERATION = "view";
    public final static String RESTART_OPERATION = "restart";

    private final static String clusterInfoFormatString = "(%s) %s\nid: %s\ndescription: %s\n\n";
    private final static String clusterNodeFormatString = "\t%s\n"; // In the future maybe more node information is available?

    @Reference
    private List<ClusteringService> clusteringServices;

    @Argument(index = 0, name = "operation", description = "", required = true)
    String operation = null;

    @Option(name = "-c", aliases = "--cluster", description = "")
    String cluster = null;

    public void setClusteringServices(List<ClusteringService> clusteringServices) {
        this.clusteringServices = clusteringServices;
    }

    @Override
    public Object execute() throws Exception {
        switch (operation) {
            case VIEW_OPERATION:
                if (isBlank(cluster)) {
                    viewClusters();
                } else {
                    viewClusterNodes(cluster);
                }
                break;
            case RESTART_OPERATION:
                restartCluster(cluster);
                break;
            default:
                throw new IllegalArgumentException("Unknown operation: " + operation);
        }
        return null;
    }

    private void viewClusters() {
        StringBuilder sb = new StringBuilder();
        clusteringServices.stream().map(service -> service.getClusteringServiceConfig()).forEach(config -> {
            sb.append(String.format(clusterInfoFormatString, config.enabled() ? "ENABLED" : "DISABLED", config.title(),
                    config.id(), config.description()));
        });
        System.out.print(sb.toString());
    }

    private void viewClusterNodes(final String cluster) {
        StringBuilder sb = new StringBuilder(String.format("Cluster (%s) Connected Nodes\n", cluster));
        clusteringServices.stream().filter(service -> service.getClusteringServiceConfig().id().equals(cluster))
                .map(service -> service.getClusteredNodeIds())
                .forEach(ids -> ids.forEach(id -> sb.append(String.format(clusterNodeFormatString, id))));
    }

    private void restartCluster(final String cluster) {
        if (isBlank(cluster)) {
            throw new IllegalArgumentException("Cluster identifier is required for restart.");
        }
        clusteringServices.stream().filter(service -> service.getClusteringServiceConfig().id().equals(cluster))
                .forEach(service -> service.restart());
    }
}
