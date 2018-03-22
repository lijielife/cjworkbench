/**
 * A component that holds a single module that is then contained within the
 * Module Library.
 * 
 * Rendered by ModuleCategories.
 * 
 * The render function here will drive the "card" of each module within
 * the library.
 */

import React from 'react'
import PropTypes from 'prop-types'
import { DragSource } from 'react-dnd';
import { getEmptyImage } from 'react-dnd-html5-backend'

// TODO: gather all functions for dragging into one utility file
const spec = {
  beginDrag(props) {
    return {
      type: 'module',
      index: false,
      id: props.id,
      name: props.name,
      icon: props.icon,
      insert: true,
    }
  },
  endDrag(props, monitor) {
    if (monitor.didDrop()) {
      const result = monitor.getDropResult();
      props.dropModule(
        result.source.id,
        result.source.index,
        {
          name: result.source.name,
          icon: result.source.icon
        }
      );
    }
  }
}

function collect(connect, monitor) {
  return {
    connectDragSource: connect.dragSource(),
    connectDragPreview: connect.dragPreview(),
    isDragging: monitor.isDragging()
  }
}

class Module extends React.Component {
  constructor(props) {
    super(props);
    this.itemClick = this.itemClick.bind(this);
  }

  itemClick(evt) {
    if (!this.props.isReadOnly) 
      this.props.addModule(this.props.id, {
        name: this.props.name,
        icon: this.props.icon
      });
    // collapse category after click when library is closed
    if (!this.props.libraryOpen)     
      this.props.setOpenCategory(null); 
  }

  componentDidMount() {
    this.props.connectDragPreview(getEmptyImage(), {
			// IE fallback: specify that we'd rather screenshot the node
			// when it already knows it's being dragged so we can hide it with CSS.
			captureDraggingState: true,
		})
  }

  componentWillReceiveProps(newProps) {
    if (newProps.isDragging !== this.props.isDragging 
        && newProps.isDragging
        && !this.props.libraryOpen
      ) 
      this.props.setOpenCategory(null);
  }

  render() {
    var moduleName = this.props.name;
    var icon = 'icon-' + this.props.icon + ' ml-icon';

    var moduleCard =  <div className='card ml-module-card' onClick={this.itemClick}>
                        <div className='second-level d-flex'>
                          <div className='d-flex flex-row align-items-center'>
                            <div className='ml-icon-container'>
                              <div className={icon} />
                            </div>
                            <div>
                              <div className='content-5 ml-module-name'>{moduleName}</div>
                            </div>
                          </div>
                          <div className='ml-handle'>
                            <div className='icon-grip' />
                          </div>
                        </div>
                      </div>;

    // Do not allow dragging if in Read-Only
    if (this.props.isReadOnly) {
      return moduleCard;
    } else {
      return this.props.connectDragSource(moduleCard);
    }
  }
}

Module.propTypes = {
  id:               PropTypes.number.isRequired,
  name:             PropTypes.string.isRequired,
  icon:             PropTypes.string.isRequired,
  addModule:        PropTypes.func,
  dropModule:       PropTypes.func,
  isReadOnly:       PropTypes.bool.isRequired,
  setOpenCategory:  PropTypes.func.isRequired,
  libraryOpen:      PropTypes.bool.isRequired,  
};

export default DragSource('module', spec, collect)(Module);
