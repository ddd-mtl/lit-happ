import {css, html, LitElement} from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { localized, msg, str } from '@lit/localize';
import { onSubmit, sharedStyles } from '@holochain-open-dev/elements';

import '@holochain-open-dev/elements/dist/elements/select-avatar.js';
import {Profile} from "../bindings/profilesAlt.types";

//import "@shoelace-style/shoelace/dist/components/avatar/avatar.js";
//import "@shoelace-style/shoelace/dist/components/button/button.js";
//import "@shoelace-style/shoelace/dist/components/icon/icon.js";
//import "@shoelace-style/shoelace/dist/components/input/input.js";
//import "@shoelace-style/shoelace/dist/components/radio/radio.js";
//import "@shoelace-style/shoelace/dist/components/radio-group/radio-group.js";
//import "@shoelace-style/shoelace/dist/components/tooltip/tooltip.js";


const MIN_NICKNAME_LENGTH = 2


/**
 * @fires save-profile - Fired when the save profile button is clicked
 */
@localized()
@customElement('profiles-edit-profile')
export class EditProfile extends LitElement {


  /** The profile to be edited. */
  @property({ type: Object })
  profile: Profile | undefined;


  /** -- Methods -- */

  /**
   * Seperate Mailgun token from other fields as we don't want it to be saved in Profiles
   */
  async fireSaveProfile(formFields: Record<string, string>) {
    console.log("fireSaveProfile()", formFields);
    const nickname = formFields['nickname'];
    delete formFields['nickname'];

    const fields: Record<string, string> = {}
    //fields['email'] = formFields['email'];
    fields['avatar'] = formFields['avatar']? formFields['avatar'] : "";
    fields['lang'] = formFields['option']? formFields['option'] : "";


    /** */
    this.dispatchEvent(
      new CustomEvent<Profile>('save-profile', {
        detail: {nickname, fields} as Profile,
        bubbles: true,
        composed: true,
      })
    );

  }


  /** */
  async handleLangChange(_e: any) {
    //console.log({langChangeEvent: e});
    const langRadioGroup = this.shadowRoot!.getElementById("langRadioGroup") as any;
    console.log({langRadioGroup});
    const lang = langRadioGroup.value;
    console.log("handleLangChange: lang =", lang);
    this.dispatchEvent(new CustomEvent('lang-selected', { detail: lang, bubbles: true, composed: true }));
  }


  /** */
  override render() {
    console.log("<profiles-edit-profile>.render()", this.profile);

    /** */
    return html`
      <form id="profile-form" class="column"
        ${onSubmit(fields => /*await*/ this.fireSaveProfile(fields))}>
          
        <div class="row"
          style="justify-content: center; align-self: start; margin-bottom: 16px; width: 100%;">
          <select-avatar
                  style="cursor:pointer"
                  name="avatar"
                .value=${this.profile?.fields['avatar'] || undefined}
              ></select-avatar>
           <label for="nickname">Nickname:</label>
          <input
            type="text"
            name="nickname"
            .label=${msg('Nickname')}
            required
            minLength=${MIN_NICKNAME_LENGTH}
            .value=${this.profile?.nickname || ''}
            .helpText=${msg(str`Min. ${MIN_NICKNAME_LENGTH} characters`)}
            style="margin-left: 16px;"
          >
        </div>
        
        <div class="row" style="justify-content: center; margin-bottom: 8px; align-self: start;" >
          <span style="font-size:18px;padding-right:10px;">${msg('Language')}:</span>
          <sl-radio-group id="langRadioGroup" @click=${this.handleLangChange} .value=${this.profile?.fields['lang']}>
            <sl-radio value="en">🇬🇧</sl-radio>
            <sl-radio value="fr-fr">🇫🇷</sl-radio>
          </sl-radio-group>
        </div>
          
        <div class="row" style="margin-top: 8px;">
          <button style="flex: 1;" variant="primary" type="submit"
            >${msg('Save Profile')}
          </button>
        </div>
      </form>
    `;
  }


  static override styles = [sharedStyles, css`

    sl-radio {
      font-size: larger;
    }
    .small-margin {
      margin-top: 6px;
    }
    .big-margin {
      margin-top: 23px;
    }

    .fill {
      flex: 1;
      height: 100%;
    }

    .title {
      font-size: 20px;
    }

    .center-content {
      align-items: center;
      justify-content: center;
    }

    .placeholder {
      color: rgba(0, 0, 0, 0.7);
    }

    .label {
      color: var(--mdc-text-field-label-ink-color, rgba(0, 0, 0, 0.6));
      font-family: var(
              --mdc-typography-caption-font-family,
              var(--mdc-typography-font-family, Roboto, sans-serif)
      );
      font-size: var(--mdc-typography-caption-font-size, 0.79rem);
      font-weight: var(--mdc-typography-caption-font-weight, 400);
    }

    .flex-scrollable-parent {
      position: relative;
      display: flex;
      flex: 1;
    }

    .flex-scrollable-container {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
    }

    .flex-scrollable-x {
      max-width: 100%;
      overflow-x: auto;
    }
    .flex-scrollable-y {
      max-height: 100%;
      overflow-y: auto;
    }`];
}
