/**
 * Contains the Module Library. The Module Library is effectively the place
 * that allows users to browse all the modules in the system that are
 * available to them. Therefore, the server should only send through the
 * modules the users are entitled to, and this class will render those modules
 * accordingly, and allow users to add them to workflows.
 *
 * Note: the current implementation mandates that this library appears vis-à-vis
 * the workflow, and is not an independent component. Perhaps, at some point, it
 * should be, so that newcomers to the system can get an idea as to the modules
 * that are supported – both, those created by us and those created by third
 * parties.
 *
 */

import PropTypes from 'prop-types'
import React from 'react'
import ModuleLibraryClosed from './ModuleLibraryClosed'
import ModuleLibraryOpen from './ModuleLibraryOpen'
import { setWfLibraryCollapseAction } from './workflow-reducer'
import { connect } from 'react-redux'
import {matchLessonHighlight} from "./util/LessonHighlight";
import {WfModule} from "./wfmodule/WfModule";
import {sortableWfModule} from "./wfmodule/WfModuleDragDropConfig";

// Helper to sort modules by category, then name
const CategoryOrder = ['Add data', 'Clean', 'Analyze', 'Visualize', 'Code', 'Other']
function moduleCategoryIndex(module) {
  const index = CategoryOrder.indexOf(module.category)
  if (index === -1) {
    return CategoryOrder.length
  } else {
    return index
  }
}
function compareModules(a, b) {
  (moduleCategoryIndex(a) - moduleCategoryIndex(b)) || a.name.localeCompare(b.name)
}

export class ModuleLibrary extends React.Component {
  constructor(props) {
    super(props);

    // Do we have any modules at all? If not, "Add Data" category starts open
    var workflowEmpty = (!props.workflow.wf_modules || !props.workflow.wf_modules.length);

    this.state = {
      openCategory: (workflowEmpty && this.props.libraryOpen) ? "Add data" : null,
      modules: ModuleLibrary.sortModules(this.props.modules),
    };

    this.addModule = this.props.addModule.bind(this);
    this.setOpenCategory = this.setOpenCategory.bind(this);
    this.toggleLibrary = this.toggleLibrary.bind(this);
    this.openLibrary = this.openLibrary.bind(this);
  }

  // Take modules from props and prepare them just the way we like 'em (sorted by category)
  static sortModules(modules) {
    return modules.slice().sort(compareModules);
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      modules: ModuleLibrary.sortModules(nextProps.modules)
    })
  }

  // Categories call this to indicate that they've been opened, so we can close all the rest
  setOpenCategory(name) {
      this.setState({openCategory: name});
  }

  itemClick(event) {
    this.props.addModule(event.target.id);
  }

  toggleLibrary() {
    this.props.setWfLibraryCollapse(this.props.workflow.id, !this.state.isCollapsed, this.props.isReadOnly)
  }

  openLibrary() {
    this.props.setWfLibraryCollapse(this.props.workflow.id, false, this.props.isReadOnly)
  }

  // Main render.
  render() {
    if (this.props.libraryOpen && !this.props.isReadOnly) {
      // Outermost div seems necessary to set background color below ImportFromGithub
      return (
        <div>
          <ModuleLibraryOpen
            workflow={this.props.workflow}
            libraryOpen={true}
            api={this.props.api}
            isReadOnly={this.props.isReadOnly}
            modules={this.state.modules}
            addModule={this.props.addModule}
            dropModule={this.props.dropModule}
            toggleLibrary={this.toggleLibrary}
            openCategory={this.state.openCategory}
            setOpenCategory={this.setOpenCategory}
          />
        </div>
      )
    } else {
      return (
        <ModuleLibraryClosed
          libraryOpen={false}
          api={this.props.api}
          isReadOnly={this.props.isReadOnly}
          modules={this.state.modules}
          addModule={this.props.addModule}
          dropModule={this.props.dropModule}
          openLibrary={this.openLibrary}
          openCategory={this.state.openCategory}
          setOpenCategory={this.setOpenCategory}
        />
      )
    }
  }
}

ModuleLibrary.propTypes = {
  addModule:    PropTypes.func.isRequired,
  dropModule:   PropTypes.func.isRequired,
  workflow:     PropTypes.object.isRequired,
  api:          PropTypes.object.isRequired,
  isReadOnly:   PropTypes.bool.isRequired,
  libraryOpen:  PropTypes.bool.isRequired,
  setWfLibraryCollapse: PropTypes.func.isRequired,
}

function mapDispatchToProps(dispatch) {
  return {
    setWfLibraryCollapse: (...args) => dispatch(setWfLibraryCollapseAction(...args)),
  }
}

function mapStateToProps(state, ownProps) {
  return {
    modules: state.modules
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ModuleLibrary)
