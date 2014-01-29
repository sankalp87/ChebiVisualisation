package com.openscience.chebi;

import org.apache.log4j.Logger;
import uk.ac.ebi.chebi.webapps.chebiWS.client.ChebiWebServiceClient;
import uk.ac.ebi.chebi.webapps.chebiWS.model.ChebiWebServiceFault_Exception;
import uk.ac.ebi.chebi.webapps.chebiWS.model.DataItem;
import uk.ac.ebi.chebi.webapps.chebiWS.model.Entity;
import uk.ac.ebi.chebi.webapps.chebiWS.model.OntologyDataItem;

import java.util.ArrayList;
import java.util.List;

/**
 *  Ontology Visualisation (OntoViz) class gets a chebiId and returns a graph data in JSON format as a function.
 *  Chebi Webservices are used to obtain the results.
 *
 * */

public class OntoViz {

    private static final Logger logger = Logger.getLogger(OntoViz.class);
    private String chebiId = "";
    protected final ChebiWebServiceClient client = new ChebiWebServiceClient();
    protected List<Entity> hasPartCompoundList = new ArrayList<Entity>();

    public void setChebiId(String chebiId) {
        this.chebiId = chebiId;
    }

    /*
    * Returns the data required for the graph in JSON format
    * **/
    public String getJSONData() {

        StringBuilder jsonData = new StringBuilder();
        try {

            logger.debug("Invoking JSONData");
            Entity compound = this.client.getCompleteEntity(this.chebiId);

            int treeHeight = 0;
            int nodeDepth[] = new int[3];
            jsonData.append("function loadData(){  json =  [");
            jsonData = getGraphData(compound, jsonData, treeHeight, nodeDepth);
            jsonData.append(" }");

        } catch (ChebiWebServiceFault_Exception e) {
            logger.error(e.getMessage());
        }
        return jsonData.toString();
    }

    /**
     * Adds the connection data and directions about the children to compound in the graph data
     */
    protected StringBuilder addChildrenConnectivityInfo(Entity compound) throws ChebiWebServiceFault_Exception {
        logger.debug("Starting method: addChildrenConnectivityInfo");
        List<OntologyDataItem> childrenRelations = compound.getOntologyChildren();
        StringBuilder childrenData = new StringBuilder();
        boolean hasChildren = false;
        if (childrenRelations.size() >= 1) {
            for (int count = 0; count < childrenRelations.size(); count++) {
                OntologyDataItem relation = childrenRelations.get(count);
                if (relation.getType().equalsIgnoreCase("is a") || relation.getType().equalsIgnoreCase("has part")) {
                    Entity children = client.getCompleteEntity(relation.getChebiId());
                    if (hasChildren) {
                        childrenData.append(",");
                    }
                    childrenData.append("{ \"nodeTo\": \"").append(removePrefixes(compound.getChebiId()));
                    childrenData.append("\", \"nodeFrom\": \"").append(removePrefixes(children.getChebiId()));
                    childrenData.append("\", \"data\": { \"$direction\": [\"");
                    childrenData.append(removePrefixes(children.getChebiId())).append("\", \"");
                    childrenData.append(removePrefixes(compound.getChebiId())).append("\" ] }}");
                    hasChildren = true;
                }
                if (count == childrenRelations.size() - 1 && hasChildren) {
                    if (!isChemicalEntity(compound) && !isRole(compound) && !isSubatomicParticle(compound)) {
                        childrenData.append(",");
                    }

                }

            }
        }
        return childrenData;
    }

    /**
     * Adds the information specific to children compound in the graph data
     */
    protected StringBuilder addChildrenCompoundInfo(Entity compound) throws ChebiWebServiceFault_Exception {
        logger.debug("Starting method: addChildrenCompoundInfo");
        List<OntologyDataItem> childrenRelations = compound.getOntologyChildren();
        StringBuilder childrenData = new StringBuilder();

        if (childrenRelations.size() >= 1) {
            for (OntologyDataItem relation : childrenRelations) {
                if (relation.getType().equalsIgnoreCase("is a") || relation.getType().equalsIgnoreCase("has part")) {
                    childrenData.append(",");
                    Entity children = client.getCompleteEntity(relation.getChebiId());
                    childrenData.append("{ \"adjacencies\": [],");
                    childrenData.append(" \"data\": { \"$color\": \"#DADADA\",");
                    childrenData.append(" \"$type\": \"rectangle\",");
                    childrenData.append(" \"$relation\": \"").append(relation.getType()).append("\",");
                    childrenData.append(" \"$def\": \"");
                    String def = compound.getDefinition();
                    if (def != null) {
                        def = def.replaceAll("\"", "");
                    }
                    childrenData.append(def);
                    childrenData.append("\", \"$cId\": \"").append(removePrefixes(children.getChebiId()));
                    childrenData.append("\", \"$formula\": \"");
                    List<DataItem> formulaeList = children.getFormulae();
                    if (formulaeList != null && formulaeList.size() > 0) {
                        childrenData.append(((formulaeList.get(0)).getData()));
                    }
                    childrenData.append("\", \"$mass\": \"").append(children.getMass());
                    childrenData.append("\" },  \"id\": \"").append(removePrefixes(children.getChebiId()));
                    childrenData.append("\", \"name\": \"").append(children.getChebiAsciiName());
                    childrenData.append("\"  }");
                }
            }
        }
        return childrenData;
    }

    /**
     * Returns the entire graph data
     */
    protected StringBuilder getGraphData(Entity compound, StringBuilder parentData, int treeHeight, int nodeDepth[]) throws ChebiWebServiceFault_Exception {
        logger.debug("Starting method: getGraphData");
        List<OntologyDataItem> parentRelations = compound.getOntologyParents();
        if (isChemicalEntity(compound)) {
            assignNodeDepth(nodeDepth, treeHeight, 0);
        }
        if (isRole(compound)) {
            assignNodeDepth(nodeDepth, treeHeight, 1);
        }
        if (isSubatomicParticle(compound)) {
            assignNodeDepth(nodeDepth, treeHeight, 2);
        }
        boolean hasParents = false;
        if (parentRelations.size() >= 1) {
            for (int count = 0; count < parentRelations.size(); count++) {
                OntologyDataItem relation = parentRelations.get(count);
                //has part is limited only to three levels.
                if (relation.getType().equalsIgnoreCase("is a")
                        || (relation.getType().equalsIgnoreCase("has part") && isLimited(treeHeight))) {
                    Entity parent = client.getCompleteEntity(relation.getChebiId());
                    if (hasParents) {
                        parentData.append(",");
                    } else {
                        if (!isZero(treeHeight)) {
                            parentData.append(",");
                        }
                        parentData.append(" {  \"adjacencies\": [");
                        if (isZero(treeHeight)) {
                            parentData.append(addChildrenConnectivityInfo(compound));
                        }
                    }

                    addParentConnectivityInfo(compound, parent, parentData, relation);
                    hasParents = true;
                }
                if (count == (parentRelations.size() - 1)) {
                    hasParents = false;
                    addParentCompoundInfo(compound, parentData, treeHeight);

                    for (OntologyDataItem incidentRelation : parentRelations) {
                        relation = incidentRelation;
                        if (relation.getType().equalsIgnoreCase("is a")) {
                            Entity parent = client.getCompleteEntity(relation.getChebiId());
                            ++treeHeight;
                            getGraphData(parent, parentData, treeHeight, nodeDepth);
                            --treeHeight;
                        }
                    }
                }
            }
        }
        if (isZero(treeHeight)) {
            if (!isChemicalEntity(compound) && !isRole(compound) && !isSubatomicParticle(compound)) {
                parentData.append(addChildrenCompoundInfo(compound));
                if (hasPartCompoundList.size() > 0) {
                    populateHasPartRelationship(hasPartCompoundList, parentData);
                }
            }

            if (parentData.toString().contains("24431") || isChemicalEntity(compound)) {
//                 logger.debug("fetching chemical entity data");
                if (!isChemicalEntity(compound)) {
                    parentData.append(",");
                }
                parentData.append("{ \"adjacencies\": [");

                if (isChemicalEntity(compound)) {
                    parentData.append(addChildrenConnectivityInfo(compound));
                }
                parentData.append(chemicalEntityData(nodeDepth[0]));
                if (isChemicalEntity(compound)) {
                    parentData.append(addChildrenCompoundInfo(compound));
                }
            }


            if (parentData.toString().contains("50906") || isRole(compound)) {
//                logger.debug("fetching role data");
                if (!isRole(compound)) {
                    parentData.append(",");
                }
                parentData.append("{ \"adjacencies\": [");
                if (isRole(compound)) {
                    parentData.append(addChildrenConnectivityInfo(compound));
                }
                parentData.append(roleData(nodeDepth[1]));
                if (isRole(compound)) {
                    parentData.append(addChildrenCompoundInfo(compound));
                }
            }

            if (parentData.toString().contains("36342") || isSubatomicParticle(compound)) {
//                logger.debug("fetching subatomic particle data");
                if (!isSubatomicParticle(compound)) {
                    parentData.append(",");
                }
                parentData.append("{ \"adjacencies\": [");
                if (isSubatomicParticle(compound)) {
                    parentData.append(addChildrenConnectivityInfo(compound));
                }
                parentData.append(subAtomicData(nodeDepth[2]));
                if (isSubatomicParticle(compound)) {
                    parentData.append(addChildrenCompoundInfo(compound));
                }
            }
            parentData.append("];");
        }
        return parentData;
    }

    /**
     * Adds the connection data and directions about the parent to compound in the graph data
     */
    protected void addParentConnectivityInfo(Entity compound, Entity parent, StringBuilder parentData, OntologyDataItem relation) {
        logger.debug("Starting method: addParentConnectivityInfo");
        parentData.append("{ \"nodeTo\": \"").append(removePrefixes(parent.getChebiId()));
        parentData.append("\", \"nodeFrom\": \"").append(removePrefixes(compound.getChebiId()));
        parentData.append("\", \"data\": { \"$direction\": [\"");
        parentData.append(removePrefixes(compound.getChebiId()));
        parentData.append("\", \"").append(removePrefixes(parent.getChebiId()));
        parentData.append("\"]");
        if (relation.getType().equalsIgnoreCase("has part")) {
            hasPartCompoundList.add(parent);
            parentData.append(", \"$color\": \"#000000\"");
        }
        parentData.append("} }");
    }

    /**
     * Adds the information specific to parent compound in the graph data
     */
    protected void addParentCompoundInfo(Entity compound, StringBuilder parentData, int treeHeight) {
        logger.debug("Starting method: addParentCompoundInfo");
        parentData.append("], \"data\": {");
        if (isZero(treeHeight)) {
            parentData.append(" \"$color\":\"#a1c7c7\"");
        } else {
            parentData.append(" \"$color\": \"#DADADA\"");
        }

        if (!parentData.toString().toLowerCase().contains("\"id\": \"" + removePrefixes(compound.getChebiId()) + "\"")) {
            parentData.append(", \"$type\": \"rectangle\",");
            parentData.append(" \"$def\": \"");
            String def = compound.getDefinition();
            if (def != null) {
                def = def.replaceAll("\"", "");
            }
            parentData.append(def);
            parentData.append("\", \"$cId\": \"").append(removePrefixes(compound.getChebiId()));
            parentData.append("\", \"$formula\": \"");
            List<DataItem> formulaeList = compound.getFormulae();
            if (formulaeList != null && formulaeList.size() > 0) {
                parentData.append((formulaeList.get(0)).getData());
            }
            parentData.append("\", \"$mass\": \"").append(compound.getMass());
            parentData.append("\"");
        }
        parentData.append(" },  \"id\": \"").append(removePrefixes(compound.getChebiId()));
        parentData.append("\", \"name\": \"").append(compound.getChebiAsciiName());
        parentData.append("\"  }");

    }

    /**
     * populates the has part relationships and adds before the ending of the data
     * */
    protected void populateHasPartRelationship(List<Entity> hasPartCompoundList, StringBuilder parentData) {
        for (Entity compound : hasPartCompoundList) {
            parentData.append(", { \"adjacencies\": [");
            addParentCompoundInfo(compound, parentData, 1);
        }

    }

    /**
     * The maximum node depth is used for sizing the canvas height.
     * */
    protected void assignNodeDepth(int[] nodeDepth, int treeHeight, int value) {
        if (nodeDepth[value] == 0) {
            nodeDepth[value] = treeHeight;
        } else if (treeHeight > nodeDepth[value]) {
            nodeDepth[value] = treeHeight;
        }
    }

    protected boolean isRole(Entity compound) {
        return compound.getChebiId().equalsIgnoreCase("CHEBI:50906");
    }

    protected boolean isChemicalEntity(Entity compound) {
        return compound.getChebiId().equalsIgnoreCase("CHEBI:24431");
    }

    protected boolean isSubatomicParticle(Entity compound) {
        return compound.getChebiId().equalsIgnoreCase("CHEBI:36342");
    }

    protected boolean isLimited(int treeHeight) {
        return treeHeight < 3;
    }

    protected boolean isZero(int treeHeight) {
        return treeHeight == 0;
    }

    protected String roleData(int nodeDepth) {
        StringBuilder data = new StringBuilder();
        data.append("],\"data\": { \"$color\": \"#a1c7c7\","
                + " \"$type\": \"rectangle\","
                + " \"$def\": \"A role is particular behaviour which" +
                " a material entity may exhibit.\","
                + "  \"$cId\": \"50906\","
                + " \"$nodeDepth\": \"").append(nodeDepth).
                append("\"}, \"id\": \"50906\","
                        + "\"name\": \"role\" }");
        return data.toString();
    }

    protected String chemicalEntityData(int nodeDepth) {
        StringBuilder data = new StringBuilder();
        data.append("],\"data\": { \"$color\": \"#a1c7c7\","
                + " \"$type\": \"rectangle\","
                + " \"$def\": \"A chemical entity is a "
                + "physical entity of interest in chemistry including "
                + "molecular entities, parts thereof,"
                + " and chemical substances.\","
                + "  \"$cId\": \"24431\","
                + " \"$nodeDepth\": \"").append(nodeDepth).
                append("\" }, \"id\": \"24431\","
                        + " \"name\": \"chemical entity\" }");
        return data.toString();
    }

    protected String subAtomicData(int nodeDepth) {
        StringBuilder data = new StringBuilder();
        data.append("],\"data\": { \"$color\": \"#a1c7c7\","
                + " \"$type\": \"rectangle\","
                + " \"$def\": \"A particle smaller than an atom.\","
                + " \"$cId\": \"36342\","
                + " \"$nodeDepth\": \"").append(nodeDepth).
                append("\" }, \"id\": \"36342\","
                        + "\"name\": \"subatomic particle\" }");
        return data.toString();
    }

    protected String removePrefixes(String chebiId) {
        return chebiId.replace("CHEBI:", "");
    }


}