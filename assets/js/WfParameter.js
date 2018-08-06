// WfParameter - a single editable parameter

import React from 'react'
import PropTypes from 'prop-types'
import MenuParam from './wfparameters/MenuParam'
import ChartSeriesMultiSelect from './wfparameters/ChartSeriesMultiSelect'
import ColumnParam from './wfparameters/ColumnParam'
import ColumnSelector from './wfparameters/ColumnSelector'
import ColumnRenamer from './wfparameters/ColumnRenamer'
import DataVersionSelect from './wfparameters/DataVersionSelect'
import DropZone from './wfparameters/DropZone'
import UpdateFrequencySelect from './wfparameters/UpdateFrequencySelect'
import OAuthConnect from './wfparameters/OAuthConnect'
import GoogleFileSelect from './wfparameters/GoogleFileSelect'
import WorkbenchAceEditor from './wfparameters/AceEditor'
import CellEditor from './wfparameters/CellEditor'
import NumberField from './wfparameters/NumberField'
import Refine from './wfparameters/Refine'
import ReorderHistory from './wfparameters/ReorderHistory'
import RenameEntries from './wfparameters/RenameEntries'
import SingleLineTextField from './wfparameters/SingleLineTextField'
import MapLocationDropZone from './wfparameters/choropleth/MapLocationDropZone'
import MapLocationPresets from './wfparameters/choropleth/MapLocationPresets'
import MapLayerEditor from './wfparameters/choropleth/MapLayerEditor'

const PRESSED_ENTER = true;
const DIDNT_PRESS_ENTER = false;

class TextOrNothing extends React.Component {
  render() {
    if (this.props.text.length > 0) {
      return <div>{this.props.text}</div>;
    } else {
      return null;
    }
  }
}

export default class WfParameter extends React.Component {
  static propTypes = {
    p: PropTypes.shape({
      id: PropTypes.number.isRequired,
      value: PropTypes.any, // initial value -- value in Redux store
      parameter_spec: PropTypes.shape({
        id_name: PropTypes.string.isRequired,
        type: PropTypes.string.isRequired,
      }).isRequired,
    }).isRequired,
    moduleName:     PropTypes.string.isRequired,
    wfModuleError:  PropTypes.string, // module-level error message
    wfModuleId:   PropTypes.number.isRequired,
    revision:       PropTypes.number.isRequired,
    api:            PropTypes.object.isRequired,
    updateSettings: PropTypes.object,             // only for modules that load data
    isReadOnly:     PropTypes.bool.isRequired,
    isZenMode:      PropTypes.bool.isRequired,
    changeParam:    PropTypes.func.isRequired,
    getParamId:     PropTypes.func.isRequired,
    getParamText:   PropTypes.func.isRequired,
    setParamText:   PropTypes.func.isRequired,
    // "new-style" API: what it should have been all along. Normal React state stuff.
    onChange: PropTypes.func.isRequired, // func(idName, newValue) => undefined
    onSubmit: PropTypes.func.isRequired, // func() => undefined
    onReset: PropTypes.func.isRequired, // func(idName) => undefined
    value: PropTypes.any // value user has edited but not saved -- usually p.value, empty is allowed
  }

  constructor(props) {
    super(props)

    this.firstProps = true

    this.getInputColNames = this.getInputColNames.bind(this);

    this.state = {
      value: this.props.p.value
    }
  }

  componentDidUpdate (prevProps) {
    if (prevProps.p.value !== this.props.p.value) {
      // Overwrite user's changes to value, if there are any.
      // More often, when this value changes the user _hasn't_ been editing
      // values, so we want to change the value to what the server says it is.
      this.setState({ value: this.props.p.value })
    }
  }

  get outerDivProps() {
    const { id_name } = this.props.p.parameter_spec

    return {
      className: this.paramClassName,
      'data-name': id_name, // super-useful when inspecting -- e.g., when developing lessons
    }
  }

  get paramClassName() {
    const { id_name, type } = this.props.p.parameter_spec

    const nameParts = id_name.split('|')[0].split('.').slice(1)

    nameParts.unshift(`wf-parameter-${type}`)
    nameParts.unshift('wf-parameter')

    return nameParts.join(' ')
  }

  get idName () {
    return this.props.p.parameter_spec.id_name
  }

  onChange = (value) => {
    this.props.onChange(this.idName, value)
  }

  onSubmit = () => {
    this.props.onSubmit()
  }

  onReset = () => {
    this.props.onReset(this.idName)
  }

  paramChanged = (newVal) => {
    this.props.changeParam(this.props.p.id, { value: newVal })
  }

  /**
   * "old-style" form: submit just this param on blur.
   */
  blur = (e) => {
    this.paramChanged(e.target.value)
  }

  onClickCheckbox = (ev) => {
    this.paramChanged(ev.target.checked)
  }

  // Return array of column names available to us, as a promise
  getInputColNames () {
    return this.props.api.inputColumns(this.props.wfModuleId)
  }

  // set contents of HTML input field corresponding to our type
  setInputValue (val) {
    const type = this.props.p.parameter_spec.type
    if (type === 'checkbox' && this.checkboxRef) {
      this.checkboxRef.value = val
    } else if ((type === 'integer' || type === 'float') && this.numberRef) {
      this.numberRef.value = val
    }
  }

  // We need to update input contents when we get new props
  componentWillReceiveProps (newProps) {
    // If this is our first time through, update form controls to current values
    // this conditional fixes https://www.pivotaltracker.com/story/show/154104065
    // TODO WTF? Nix this; React state solves this tidily.
    if (this.firstProps) {
      this.setInputValue(newProps.p.value);
      this.firstProps = false;
    }
  }

  onChangeGoogleFileSelectJson = (json) => {
    this.props.onChange(this.props.name, json)
    this.props.onSubmit()
  }

  fetchInputColumns = () => {
    return this.props.api.inputColumns(this.props.wfModuleId)
  }

  onChangeYColumns = (arr) => {
    this.props.setParamText('y_columns', JSON.stringify(arr))
  }

  colRenameSaveState = (state) => {
    this.props.setParamText('newcolnames', state)
  }

  render_secret_parameter() {
    const { id_name } = this.props.p.parameter_spec
    const { id, value } = this.props.p
    const secretName = value ? (value.name || null) : null

    switch (id_name) {
      case 'google_credentials':
      case 'twitter_credentials':
        return (
          <OAuthConnect
            paramId={id}
            api={this.props.api}
            secretName={secretName}
            />
        )

     default:
       return (<p className="error">Secret type {id_name} not handled</p>)
    }
  }

  // Render one of the many parameter types that are specific to a particular module
  render_custom_parameter () {
    const { id_name, name } = this.props.p.parameter_spec

    switch (id_name) {
      case 'version_select':
        const button = (!this.props.isReadOnly)
          ? <button className='button-blue action-button mt-0' onClick={this.props.onSubmit}>{name}</button>
          : null

        return (
          <div {...this.outerDivProps}>
            <UpdateFrequencySelect
              wfModuleId={this.props.wfModuleId}
              isReadOnly={this.props.isReadOnly}
            />
            <div className="d-flex justify-content-between mt-2">
              <DataVersionSelect wfModuleId={this.props.wfModuleId}/>
              {button}
            </div>

          </div>
        );
      case 'version_select_simpler':
        return (
          <div className='versionSelect--uploadFile'>
            <DataVersionSelect wfModuleId={this.props.wfModuleId}/>
          </div>
        );
      case 'colrename':
        const renameParam = this.props.getParamText('newcolnames');
        return (
          <div className=''>
            <ColumnRenamer
              isReadOnly={this.props.isReadOnly}
              renameParam={renameParam}
              saveState={this.colRenameSaveState}
              getColNames={this.getInputColNames}
              revision={this.props.revision}/>
          </div>
        );
      case 'file':
        return (
          <DropZone
            wfModuleId={this.props.wfModuleId}
            revision={this.props.revision}
            api={this.props.api}
          />
        )
      case 'googlefileselect':
        const secret = this.props.getParamText('google_credentials')
        const secretName = secret ? (secret.name || null) : null
        return (
          <GoogleFileSelect
            api={this.props.api}
            googleCredentialsParamId={this.props.getParamId('google_credentials')}
            googleCredentialsSecretName={secretName}
            fileMetadataJson={this.props.getParamText('googlefileselect')}
            onChangeJson={this.onChangeGoogleFileSelectJson}
          />
        )
      case 'code':
        return (
          <WorkbenchAceEditor
            name={this.props.p.parameter_spec.name}
            isZenMode={this.props.isZenMode}
            wfModuleError={this.props.wfModuleError}
            save={this.paramChanged}
            defaultValue={this.props.p.value}
          />
        )
      case 'celledits':
        return (
          <CellEditor
            edits={this.props.p.value}
            onSave={this.paramChanged}
          />
        )
      case 'refine':
        return (
          <Refine
            api={this.props.api}
            wfModuleId={this.props.wfModuleId}
            selectedColumn={this.props.getParamText('column')}
            existingEdits={this.props.p.value}
            saveEdits={this.paramChanged}
            revision={this.props.revision}
          />
        )
      case 'reorder-history':
        return (
          <ReorderHistory
            history={this.props.getParamText('reorder-history')}
          />
        )
      case 'rename-entries':
        return (
          <RenameEntries
            api={this.props.api}
            entriesJsonString={this.props.p.value}
            wfModuleId={this.props.wfModuleId}
            paramId={this.props.p.id}
            revision={this.props.revision}
            isReadOnly={this.props.isReadOnly}
          />
        )
      case 'y_columns':
        return (
          <ChartSeriesMultiSelect
            prompt='Select a numeric column'
            isReadOnly={this.props.isReadOnly}
            workflowRevision={this.props.revision}
            series={JSON.parse(this.props.p.value || '[]')}
            fetchInputColumns={this.fetchInputColumns}
            onChange={this.onChangeYColumns}
          />
        )
      case 'map-geojson':
        return (
          <MapLocationDropZone
            api={this.props.api}
            name={this.props.p.parameter_spec.name}
            paramData={this.props.p.value}
            paramId={this.props.p.id}
            isReadOnly={this.props.isReadOnly}
          />
        )
      case 'map-presets':
        return (
          <MapLocationPresets
            api={this.props.api}
            name={this.props.p.parameter_spec.name}
            paramData={this.props.p.value}
            paramId={this.props.p.id}
            isReadOnly={this.props.isReadOnly}
          />
        )
      case 'map-layers':
        return (
          <MapLayerEditor
            api={this.props.api}
            name={this.props.p.parameter_spec.name}
            paramId={this.props.p.id}
            keyColumn={this.props.getParamText("key-column")}
            wfModuleId={this.props.wf_module_id}
            isReadOnly={this.props.isReadOnly}
            paramData={this.props.p.value}
          />
        )
      default:
        return (
          <p className="error">Custom type {id_name} not handled</p>
        )
    }
  }

  displayConditionalUI(condition) {
    // Checks if a menu item in the visibility condition is selected
    // If yes, display or hide the item depending on whether we have inverted the visibility condition
    // type is either 'visible_if' or 'visible_if_not'
    if(('id_name' in condition) && ('value' in condition)) {
      // If the condition value is a boolean:
      if (typeof condition['value'] === typeof true) {
        // Just return if it matches or not
        return condition['value'] === this.props.getParamText(condition['id_name']);
        // TODO: Does this also work with strings? Do we want it to?
      }

      // Otherwise, if it's a menu item:
      let condValues = condition['value'].split('|').map(cond => cond.trim());
      let selectionIdx = parseInt(this.props.getParamText(condition['id_name']));
      if(!isNaN(selectionIdx)) {
        let menuItems = this.props.getParamMenuItems(condition['id_name']);
        if(menuItems.length > 0) {
          let selection = menuItems[selectionIdx];
          let selectionInCondition = (condValues.indexOf(selection) >= 0);
          // No 'invert' means do not invert
          if(!('invert' in condition)) {
            return selectionInCondition;
          } else if(!condition['invert']) {
            return selectionInCondition;
          } else {
            return !selectionInCondition;
          }
        }
      }
    }
    // If the visibility condition is empty or invalid, default to showing the parameter
    return true;
  }

  render() {
    const { id_name, name, type, visible_if, visible_if_not } = this.props.p.parameter_spec

    if (!this.props.p.visible) {
      return null // nothing to see here
    }

    if (visible_if) {
      const condition = JSON.parse(visible_if)
      if (!this.displayConditionalUI(condition, 'visible_if')) {
        return null
      }
    }

    if (visible_if_not) {
      const condition = JSON.parse(visible_if_not)
      if (!this.displayConditionalUI(condition, 'visible_if_not')) {
        return null
      }
    }

    switch (type) {
      case 'string':
        // Different size and style if it's a multiline string
        if (this.props.p.parameter_spec.multiline) {
          return (
            <div {...this.outerDivProps}>
              <div className='label-margin t-d-gray content-3'>{name}</div>
              <textarea
                onBlur={this.blur}
                readOnly={this.props.isReadOnly}
                className='module-parameter t-d-gray content-3 text-field-large'
                name={id_name}
                rows={4}
                defaultValue={this.props.p.value}
                placeholder={this.props.p.parameter_spec.placeholder || ''}
              />
            </div>
          )
        } else {
          return (
            <div {...this.outerDivProps}>
              <div className='label-margin t-d-gray content-3'>{name}</div>
              <SingleLineTextField
                isReadOnly={this.props.isReadOnly}
                onSubmit={this.onSubmit}
                onChange={this.onChange}
                onReset={this.onReset}
                name={id_name}
                initialValue={this.props.p.value}
                value={this.props.value}
              />
            </div>
          )
        }

      case 'integer':
      case 'float':
        return (
          <div {...this.outerDivProps}>
            <div className='label-margin t-d-gray content-3'>{name}</div>
            <NumberField
              isReadOnly={this.props.isReadOnly}
              onChange={this.onChange}
              onSubmit={this.onSubmit}
              onReset={this.onReset}
              initialValue={this.props.p.value}
              value={this.props.value}
              placeholder={this.props.p.parameter_spec.placeholder || ''}
            />
          </div>
        );

      case 'button':
        return (
          <div {...this.outerDivProps} className={this.paramClassName + ' d-flex justify-content-end'}>
            <button className='action-button button-blue' onClick={this.props.readOnly ? null : this.props.onSubmit}>{name}</button>
          </div>
        );
      case 'statictext':
        return (
          <div {...this.outerDivProps} className={this.paramClassName + ' t-m-gray info-2'}>{name}</div>
        );

      case 'checkbox':
        return (
          <div {...this.outerDivProps} className={this.paramClassName + ' checkbox-wrapper'}>
            <div className='d-flex align-items-center'>
              <input
                disabled={this.props.isReadOnly}
                type="checkbox" className="checkbox"
                checked={this.props.p.value}
                onChange={this.onClickCheckbox}
                name={id_name}
                ref={ el => this.checkboxRef = el}
                id={this.props.p.id} />
              <label htmlFor={this.props.p.id} className='t-d-gray content-3'>{name}</label>
            </div>
          </div>
        );

      case 'menu':
        return (
          <div {...this.outerDivProps}>
            <div className='label-margin t-d-gray content-3'>{name}</div>
            <MenuParam
              name={id_name}
              items={this.props.p.menu_items}
              selectedIdx={parseInt(this.props.p.value)}
              isReadOnly={this.props.isReadOnly}
              onChange={this.paramChanged}
            />
          </div> );

      case 'column':
        return (
          <div {...this.outerDivProps}>
            <div className='label-margin t-d-gray content-3'>{name}</div>
            <ColumnParam
              value={this.props.p.value}
              name={id_name}
              prompt={this.props.p.parameter_spec.placeholder}
              isReadOnly={this.props.isReadOnly}
              workflowRevision={this.props.revision}
              fetchInputColumns={this.getInputColNames}
              onChange={this.paramChanged}
            />
          </div>
        )

      case 'multicolumn':
        return (
          <div {...this.outerDivProps}>
            <div className='t-d-gray content-3 label-margin'>{name}</div>
            <ColumnSelector
              selectedCols={this.props.getParamText('colnames')}
              saveState={state => this.props.setParamText('colnames', state) }
              getColNames={this.getInputColNames}
              name={id_name}
              isReadOnly={this.props.isReadOnly}
              revision={this.props.revision} />
          </div> );

      case 'secret':
        return this.render_secret_parameter();

      case 'custom':
        return this.render_custom_parameter();

      default:
        return null;  // unrecognized parameter type
    }
  }
}
