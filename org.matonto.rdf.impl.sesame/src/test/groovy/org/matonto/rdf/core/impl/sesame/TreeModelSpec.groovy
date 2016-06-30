/*-
 * #%L
 * org.matonto.rdf.impl.sesame
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
package org.matonto.rdf.core.impl.sesame

import spock.lang.Specification

class TreeModelSpec extends Specification {

    def "default constructor"() {
        expect:
        new TreeModel() instanceof TreeModel
    }

    def "TreeModel(Model)"() {
        setup:
        def s = new SimpleIRI("http://test.com/s")
        def p = new SimpleIRI("http://test.com/p")
        def o = new SimpleIRI("http://test.com/o")
        def model2 = new SesameModelWrapper(new org.openrdf.model.impl.LinkedHashModel())
        model2.add(s, p, o)
        def model = new TreeModel(model2)

        expect:
        model.size() == 1
    }

    def "TreeModel(Collection)"() {
        setup:
        def s = new SimpleIRI("http://test.com/s")
        def p = new SimpleIRI("http://test.com/p")
        def o = new SimpleIRI("http://test.com/o")
        def collection = [new SimpleStatement(s, p, o)]
        def model = new TreeModel(collection)

        expect:
        model.size() == 1
    }

    def "TreeMode(Namespaces)"() {
        setup:
        def ns = [new SimpleNamespace("http://test.com#", "Classname")] as Set
        def model = new TreeModel(ns)

        expect:
        model.getNamespace("http://test.com#").get() == ns[0]
        model.getNamespaces() == ns
    }

    def "TreeMode(Namespaces, Collection)"() {
        setup:
        def ns = [new SimpleNamespace("http://test.com#", "Classname")] as Set
        def s = new SimpleIRI("http://test.com/s")
        def p = new SimpleIRI("http://test.com/p")
        def o = new SimpleIRI("http://test.com/o")
        def collection = [new SimpleStatement(s, p, o)]
        def model = new TreeModel(ns, collection)

        expect:
        model.getNamespace("http://test.com#").get() == ns[0]
        model.getNamespaces() == ns
        model.size() == 1
    }
}
