import {ProfilesAltPerspective} from "./profilesAlt.zvm";
import {Profile as ProfileMat} from "./bindings/profiles.types";
import {html, TemplateResult} from "lit";
import {AgentId} from "@ddd-qc/cell-proxy";

/** */
export function getInitials(nickname: string): string {
    const names = nickname.split(' ');
    let initials = names[0].substring(0, 1).toUpperCase();
    if (names.length > 1) {
        initials += names[names.length - 1].substring(0, 1).toUpperCase();
    } else {
        initials += names[0].substring(1, 2);
    }
    return initials;
}



/** */
export function agent2avatar(key: AgentId, profilesPerspective: ProfilesAltPerspective): [ProfileMat, TemplateResult<1>] {
    let profile = {nickname: "unknown", fields: {}} as ProfileMat;
    const maybeProfilePair = profilesPerspective.profiles.get(key);
    if (maybeProfilePair) {
        profile = maybeProfilePair[0];
    } else {
        console.log("Profile not found for agent", key, profilesPerspective.profiles)
    }
    const initials = getInitials(profile.nickname);
    const avatarUrl = profile.fields['avatar'];
    const avatar =
        avatarUrl? html`
          <sl-avatar class="activityAvatar" style="box-shadow: 1px 1px 1px 1px rgba(130, 122, 122, 0.88)">
              <img src=${avatarUrl}>
        </sl-avatar>                   
            ` : html`
        <sl-avatar class="activityAvatar" shape="circle" initials=${initials} color-scheme="Accent2"></sl-avatar>
                `;
    return [profile, avatar];
}
