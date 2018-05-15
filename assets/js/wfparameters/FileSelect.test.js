import React from 'react'
import FileSelect  from './FileSelect'
import { mount, shallow } from 'enzyme'
import { jsonResponseMock } from '../test-utils'

describe('FileSelect', () => {
  let gDriveFileMeta = JSON.stringify({
    "kind": "drive#file",
    "id": "aushwyhtbndh7365YHALsdfsdf987IBHJB98uc9uisdj",
    "name": "Police Data",
    "mimeType": "application/vnd.google-apps.spreadsheet"
  })

  const gDriveFiles = {
    "kind": "drive#fileList", 
    "incompleteSearch": false,
    "files": [
      {
        "kind": "drive#file",
        "id": "aushwyhtbndh7365YHALsdfsdf987IBHJB98uc9uisdj",
        "name": "Police Data",
        "mimeType": "application/vnd.google-apps.spreadsheet"
      },
      {
        "kind": "drive#file",
        "id": "jdsiu9cu89BJHBI789fdsfdsLAHY5637hdnbthywhsua",
        "name": "Government Contracts",
        "mimeType": "application/vnd.google-apps.spreadsheet"
      },
      {
        "kind": "drive#file",
        "id": "sdf987IBHJB98uc9uisdjaushwyhtbndh7365YHALsdf",
        "name": "Labor and materials",
        "mimeType": "application/vnd.google-apps.spreadsheet"
      },
      {
        "kind": "drive#file",
        "id": "fdsLAHY5637hdnbthywhsuajdsiu9cu89BJHBI789fds",
        "name": "Budget",
        "mimeType": "application/vnd.google-apps.spreadsheet"
      },
      {
        "kind": "drive#file",
        "id": "9BJHBI789fdsfdsLAHY5637hdnbthywhsuajdsiu9cu8",
        "name": "Science Data",
        "mimeType": "application/vnd.google-apps.spreadsheet"
      }
    ]
  };

  // Mount is necessary to invoke componentDidMount()
  let api;
  beforeEach(() => {
    api = {
      postParamEvent: jsonResponseMock(gDriveFiles)
    }
  })

  // FIXME upgrade to React v16 and uncomment this test
  //it('Loads correctly and allows a user to choose a new file', (done) => {
  //  var wrapper = mount(
  //    <FileSelect
  //      api={api}
  //      userCreds={[0]}
  //      pid={1}
  //      saveState={ (state) => { gDriveFileMeta = JSON.stringify(state); } }
  //      getState={() => { return gDriveFileMeta; }}
  //    />
  //  );

  //  expect(api.postParamEvent.mock.calls.length).toBe(1);

  //  expect(wrapper).toMatchSnapshot();

  //  // should call API for its data on componentDidMount
  //  expect(wrapper.state().modalOpen).toBe(false);

  //  setImmediate( () => {
  //    var fileName = wrapper.find('span.t-d-gray.content-3.mb-3');
  //    var modalLink = wrapper.find('.file-info .t-f-blue');
  //    expect(fileName.text()).toEqual('Police Data');
  //    modalLink.simulate('click');

  //    setImmediate( () => {
  //      expect(wrapper.state().modalOpen).toBe(true);

  //      let modal_element = document.getElementsByClassName('modal-dialog');
  //      expect(modal_element.length).toBe(1);
  //      let modal = new ReactWrapper(modal_element[0], true);

  //      expect(modal).toMatchSnapshot();
  //      expect(modal.find('.list-body')).toHaveLength(1);

  //      expect(wrapper.state().files).toEqual(gDriveFiles['files']);
  //      let filesListItems = modal.find('.line-item--data-version');
  //      expect(filesListItems).toHaveLength(5);

  //      let secondListItem = filesListItems.filterWhere(n => n.key() == 1);
  //      expect(secondListItem).toHaveLength(1);
  //      secondListItem.simulate('click');

  //      setImmediate( () => {

  //        expect(wrapper.state().file).toEqual({
  //          "kind": "drive#file",
  //          "id": "jdsiu9cu89BJHBI789fdsfdsLAHY5637hdnbthywhsua",
  //          "name": "Government Contracts",
  //          "mimeType": "application/vnd.google-apps.spreadsheet"
  //        });
  //        done();
  //      })

  //    });
  //  });
  //});

  it('Shows the file count and larger button if there is no file and a user credential is present', (done) => {
    const noFileWrapper = shallow(
      <FileSelect
        api={api}
        userCreds={[0]}
        pid={1}
        saveState={ (state) => { gDriveFileMeta = JSON.stringify(state); } }
        getState={() => ''}
      />
    )

    expect(api.postParamEvent).toHaveBeenCalled()

    setImmediate(() => {
      noFileWrapper.update()
      const fileCount = noFileWrapper.find('.file-info p')
      expect(fileCount).toHaveLength(1)
      expect(fileCount.text()).toBe('5 files found')

      const modalLink = noFileWrapper.find('.button-orange.action-button')
      expect(modalLink).toHaveLength(1)

      done()
    })
  })

  it('Does not show the modal link if there is no user credential present', () => {
    const noCredsWrapper = shallow(
      <FileSelect
        api={api}
        userCreds={[]}
        pid={1}
        saveState={ (state) => { gDriveFileMeta = JSON.stringify(state); } }
        getState={() => { return gDriveFileMeta; }}
      />
    )

    expect(api.postParamEvent).not.toHaveBeenCalled()
    expect(noCredsWrapper).toMatchSnapshot();

    const modalLink = noCredsWrapper.find('.file-info .t-f-blue')

    expect(modalLink).toHaveLength(0)
  })

  it('Does not show anything if neither a user credential nor a file are present', (done) => {
    var noCredsNoFileWrapper = shallow(
      <FileSelect
        api={api}
        userCreds={[]}
        pid={1}
        saveState={ (state) => { gDriveFileMeta = JSON.stringify(state); } }
        getState={() => { return ''; }}
      />
    )

    expect(api.postParamEvent).not.toHaveBeenCalled()
    expect(noCredsNoFileWrapper).toMatchSnapshot();

    expect(noCredsNoFileWrapper.find('.parameter-margin').length).toBe(0);

    done();
  });

});
