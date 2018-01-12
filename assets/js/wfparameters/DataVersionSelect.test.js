import React from 'react'
import DataVersionSelect  from './DataVersionSelect'
import { mount, ReactWrapper } from 'enzyme'
import { okResponseMock, jsonResponseMock } from '../utils'

jest.useFakeTimers();

describe('DataVersionSelect', () => {

  var mockVersions = {
    versions: [
      ['2017-07-10 17:57:58.324Z', false],
      ['2017-06-10 17:57:58.324Z', true],
      ['2017-05-10 17:57:58.324Z', true],
      ['2017-04-10 17:57:58.324Z', true],
      ['2017-03-10 17:57:58.324Z', true]
    ],
    selected: '2017-04-10 17:57:58.324Z'
  };
  var api;
  var wrapper;

  // Mount is necessary to invoke componentDidMount()
  beforeEach(() => {
    api = {
      getWfModuleVersions: jsonResponseMock(mockVersions),
      setWfModuleVersion: okResponseMock(),
    };

    wrapper = mount(
      <DataVersionSelect
        isReadOnly={false}
        wfModuleId={808}
        revision={202}
        api={api}
        setClickNotification={()=>{return false}}
        testing={true}
      />
    );
  });

  it('Renders correctly when in Private mode, and selection is confirmed when user hits OK', (done) => {

    // should call API for its data on componentDidMount
    expect(api.getWfModuleVersions.mock.calls.length).toBe(1);

    expect(wrapper).toMatchSnapshot();  // 1

    // Start with dialog closed
    expect(wrapper.state().modalOpen).toBe(false);

    // give versions a chance to load
    setImmediate( () => {
      var modalLink = wrapper.find('div.open-modal');
      expect(modalLink).toHaveLength(1);
      expect(modalLink.text()).toEqual("Apr 10 2017 - 05:57PM");

      expect(wrapper.find('.t-d-gray').text()).toEqual("Version 2 of 5");

      modalLink.simulate('click');
      expect(wrapper.state().modalOpen).toBe(true);

      // Need setImmediate to give modal a chance to fill with data, API returns a promise that must resolve
      setImmediate( () => {
        expect(wrapper.state().modalOpen).toBe(true);

        // The insides of the Modal are a "portal", that is, attached to root of DOM, not a child of Wrapper
        // So find them, and make a new Wrapper
        // Reference: "https://github.com/airbnb/enzyme/issues/252"
        let modal_element = document.getElementsByClassName('modal-dialog');
        expect(modal_element.length).toBe(1);
        let modal = new ReactWrapper(modal_element[0], true);

        expect(modal).toMatchSnapshot(); // 2
        expect(modal.find('.list-body')).toHaveLength(1);

        // check that the versions have loaded and are displayed in list
        expect(wrapper.state().versions).toEqual(mockVersions);
        let versionsList = modal.find('.list-test-class');
        expect(versionsList).toHaveLength(5);

        // filter list to grab first item
        let firstVersion = versionsList.filterWhere(n => n.key() == '2017-07-10 17:57:58.324Z');
        expect(firstVersion).toHaveLength(1);
        firstVersion.simulate('click');

        expect(wrapper.state().versions.selected).toEqual('2017-07-10 17:57:58.324Z');
        expect(wrapper.state().originalSelected).toEqual('2017-04-10 17:57:58.324Z');

        let okButton = modal.find('.test-ok-button');
        expect(okButton).toHaveLength(1);
        okButton.first().simulate('click');

        // state needs to update and modal needs to close
        setImmediate( () => {
          // timezone bugs
          expect(wrapper).toMatchSnapshot(); // 3
          expect(wrapper.state().modalOpen).toBe(false);
          expect(wrapper.state().originalSelected).toEqual('2017-07-10 17:57:58.324Z');
          expect(api.getWfModuleVersions.mock.calls.length).toBe(1);
          expect(api.setWfModuleVersion.mock.calls.length).toBe(1);
          done();
        });
      });
    });
  });

  // Pared-down version of first test
  it('Does not save selection when user hits Cancel', (done) => {

    expect(api.getWfModuleVersions.mock.calls.length).toBe(1);

    setImmediate( () => {
      var modalLink = wrapper.find('div.open-modal');
      expect(modalLink).toHaveLength(1);
      modalLink.simulate('click');
      expect(wrapper.state().modalOpen).toBe(true);

      let modal_element = document.getElementsByClassName('modal-dialog');
      // select the second element in array for this test
      expect(modal_element.length).toBe(2);
      let modal = new ReactWrapper(modal_element[1], true);

      // check that the versions have loaded and are displayed in list
      expect(wrapper.state().versions).toEqual(mockVersions);
      let versionsList = modal.find('.list-test-class');
      expect(versionsList).toHaveLength(5);
      let lastVersion = versionsList.filterWhere(n => n.key() == '2017-03-10 17:57:58.324Z');
      lastVersion.simulate('click');

      expect(wrapper.state().versions.selected).toEqual('2017-03-10 17:57:58.324Z');
      expect(wrapper.state().originalSelected).toEqual('2017-04-10 17:57:58.324Z');

      let cancelButton = modal.find('.test-cancel-button');
      cancelButton.first().simulate('click');

      setImmediate( () => {
        expect(wrapper).toMatchSnapshot();              // 4
        expect(wrapper.state().modalOpen).toBe(false);
        expect(wrapper.state().originalSelected).toEqual('2017-04-10 17:57:58.324Z');
        expect(api.setWfModuleVersion.mock.calls.length).toBe(0); // never called because user cancelled
        done();
      });
    });
  });

  it('Does not open modal when in read-only mode', (done) => {
    let readOnlywrapper = mount(<DataVersionSelect
      isReadOnly={true}
      wfModuleId={808}
      revision={202}
      api={api}
      testing={true}
      setClickNotification={()=>{return false;}}
    />);

    expect(api.getWfModuleVersions.mock.calls.length).toBe(2); // 2 not 1 because beforeEach mounted "wrapper" already

    setImmediate(() => {
      let readOnlyModalLink = readOnlywrapper.find('div.open-modal');

      readOnlyModalLink.simulate('click');
      expect(readOnlywrapper.state().modalOpen).toBe(false);

      done();
    });
  });

  it('Displays empty when no versions available', (done) => {

    var emptyApi = {
      getWfModuleVersions: jsonResponseMock({versions: [], selected: null}),
      setWfModuleVersion: okResponseMock(),
    };

    let wrapper2 = mount(<DataVersionSelect
      isReadOnly={true}
      wfModuleId={808}
      revision={202}
      api={emptyApi}
      testing={true}
      setClickNotification={()=>{return false;}}
    />);

    setImmediate( () => {
      expect(emptyApi.getWfModuleVersions.mock.calls.length).toBe(1);

      var modalLink2 = wrapper2.find('div.open-modal');
      expect(modalLink2).toHaveLength(1);
      expect(modalLink2.text()).toBe('-');

      expect(wrapper2).toMatchSnapshot();
      done();
    });

  });
});
