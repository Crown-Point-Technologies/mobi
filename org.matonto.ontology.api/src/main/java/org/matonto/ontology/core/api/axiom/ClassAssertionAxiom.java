package org.matonto.ontology.core.api.axiom;


import org.matonto.ontology.core.api.classexpression.ClassExpression;
import org.matonto.ontology.core.api.Individual;

public interface ClassAssertionAxiom extends AssertionAxiom {

	Individual getIndividual();
	
	ClassExpression getClassExpression();
}