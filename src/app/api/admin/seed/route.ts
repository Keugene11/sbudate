import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const ADMIN_USER_IDS = ["keugenelee11@gmail.com"];

async function getAdmin() {
  const serverSupabase = await createServerClient();
  const { data: { user } } = await serverSupabase.auth.getUser();
  if (!user || !ADMIN_USER_IDS.includes(user.email || "")) return null;
  return user;
}

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

const FAKE_PROFILES = [
  {
    first_name: "Sophia", last_name: "Chen", age: 20, gender: "Woman", gender_preference: "Men",
    height_inches: 64, major: "Biology", graduation_year: 2027, hometown: "Flushing, NY",
    residence_hall: "Greeley Hall", ethnicity: "East Asian", drinking: "Sometimes", smoking: "No",
    prompts: [
      { question: "My simple pleasures", answer: "Iced matcha on the way to class, a perfect sunset over Roth Pond, and when my lab results actually make sense" },
      { question: "Typical Sunday", answer: "Brunch at the SAC, study grind at the library, then a long walk around campus when the sun is setting" },
      { question: "I'm looking for", answer: "Someone who can keep up with my random 2am study breaks and isn't afraid of a little friendly debate" },
    ],
  },
  {
    first_name: "Marcus", last_name: "Johnson", age: 21, gender: "Man", gender_preference: "Women",
    height_inches: 72, major: "Computer Science", graduation_year: 2026, hometown: "Brooklyn, NY",
    residence_hall: "West Apartments", ethnicity: "Black/African American", drinking: "Yes", smoking: "No",
    prompts: [
      { question: "A life goal of mine", answer: "Start my own tech company before 30. Already got two side projects and a lot of caffeine keeping me going" },
      { question: "The way to win me over is", answer: "Show me your Spotify Wrapped. Music taste tells me everything I need to know about a person" },
      { question: "We'll get along if", answer: "You can beat me in Mario Kart (you can't) or if you appreciate a good home-cooked meal" },
    ],
  },
  {
    first_name: "Emily", last_name: "Rivera", age: 19, gender: "Woman", gender_preference: "Men",
    height_inches: 62, major: "Psychology", graduation_year: 2028, hometown: "Bayshore, NY",
    residence_hall: "Benedict North", ethnicity: "Hispanic/Latino", drinking: "No", smoking: "No",
    prompts: [
      { question: "My most irrational fear", answer: "That one day the campus geese will organize and take over. They already have no fear" },
      { question: "Dating me is like", answer: "Having a personal hype woman who also psychoanalyzes your attachment style (affectionately)" },
      { question: "Green flags I look for", answer: "You text back within a reasonable time, you're kind to service workers, and you have at least one passion you won't shut up about" },
    ],
  },
  {
    first_name: "James", last_name: "Park", age: 22, gender: "Man", gender_preference: "Women",
    height_inches: 70, major: "Mechanical Engineering", graduation_year: 2026, hometown: "Syosset, NY",
    residence_hall: "Chapin Apartments", ethnicity: "East Asian", drinking: "Sometimes", smoking: "No",
    prompts: [
      { question: "Two truths and a lie", answer: "I've built a working go-kart from scratch, I can solve a Rubik's cube in under a minute, I'm a morning person" },
      { question: "I go crazy for", answer: "A good ramen spot. If you know a place that does tonkotsu right, I'm already in love" },
      { question: "Together we could", answer: "Road trip to every national park on the East Coast. I'll drive, you pick the playlist" },
    ],
  },
  {
    first_name: "Aaliyah", last_name: "Williams", age: 20, gender: "Woman", gender_preference: "Men",
    height_inches: 66, major: "Business Management", graduation_year: 2027, hometown: "Jamaica, NY",
    residence_hall: "Gershwin Hall", ethnicity: "Black/African American", drinking: "Sometimes", smoking: "No",
    prompts: [
      { question: "I'm convinced that", answer: "The SAC food court hits different at 1am and nobody can tell me otherwise" },
      { question: "My love language is", answer: "Quality time. Put your phone down, look me in the eyes, and tell me about your day. That's all I need" },
      { question: "You should leave a comment if", answer: "You've got a good restaurant recommendation or a hot take about reality TV" },
    ],
  },
  {
    first_name: "Ryan", last_name: "O'Brien", age: 21, gender: "Man", gender_preference: "Women",
    height_inches: 74, major: "Political Science", graduation_year: 2026, hometown: "Garden City, NY",
    residence_hall: "Hendrix Hall", ethnicity: "White/Caucasian", drinking: "Yes", smoking: "No",
    prompts: [
      { question: "Let's debate this topic", answer: "Pineapple on pizza is elite and I will defend this until my last breath" },
      { question: "My biggest date fail", answer: "Took someone to a 'nice restaurant' that turned out to be permanently closed. We ended up at 7-Eleven and honestly it was a vibe" },
      { question: "I want someone who", answer: "Isn't afraid to be goofy in public. Life's too short to be cool all the time" },
    ],
  },
  {
    first_name: "Priya", last_name: "Patel", age: 20, gender: "Woman", gender_preference: "Men",
    height_inches: 63, major: "Health Science", graduation_year: 2027, hometown: "Edison, NJ",
    residence_hall: "Irving Hall", ethnicity: "South Asian", drinking: "No", smoking: "No",
    prompts: [
      { question: "A life goal of mine", answer: "Become a physician and open a free clinic. Big dreams require big study sessions — join me at the library?" },
      { question: "I recently discovered that", answer: "I'm actually really good at bowling? Like suspiciously good for someone who's been twice" },
      { question: "Believe it or not, I", answer: "Can name every bone in the human body but still can't parallel park to save my life" },
    ],
  },
  {
    first_name: "Daniel", last_name: "Kim", age: 21, gender: "Man", gender_preference: "Women",
    height_inches: 69, major: "Data Science", graduation_year: 2026, hometown: "Fort Lee, NJ",
    residence_hall: "West Apartments", ethnicity: "East Asian", drinking: "Sometimes", smoking: "No",
    prompts: [
      { question: "My simple pleasures", answer: "Clean code that runs on the first try, a perfect cup of pourover coffee, and finding a quiet spot in the library" },
      { question: "My most controversial opinion", answer: "Tabs are better than spaces and dark mode is the only acceptable IDE theme" },
      { question: "I'm looking for", answer: "Someone who appreciates comfortable silence. We can vibe without filling every second with words" },
    ],
  },
  {
    first_name: "Jessica", last_name: "Nguyen", age: 19, gender: "Woman", gender_preference: "Men",
    height_inches: 61, major: "Communication", graduation_year: 2028, hometown: "Hicksville, NY",
    residence_hall: "Stimson Hall", ethnicity: "Southeast Asian", drinking: "Sometimes", smoking: "No",
    prompts: [
      { question: "Typical Sunday", answer: "Farmers market in the morning, creative writing at a coffee shop, then movie night with my roommates" },
      { question: "I'm weirdly attracted to", answer: "People who get really passionate explaining something nerdy. Tell me about your weird hobby, I'm all ears" },
      { question: "The one thing I'd love to know about you is", answer: "What's the last thing that made you laugh so hard you cried?" },
    ],
  },
  {
    first_name: "Michael", last_name: "Torres", age: 22, gender: "Man", gender_preference: "Women",
    height_inches: 71, major: "Nursing", graduation_year: 2026, hometown: "Brentwood, NY",
    residence_hall: "Schomburg Apartments", ethnicity: "Hispanic/Latino", drinking: "Sometimes", smoking: "No",
    prompts: [
      { question: "Change my mind about", answer: "The SBU gym is the best free amenity on campus. Where else are you getting gains AND people-watching?" },
      { question: "Dating me is like", answer: "Having someone who'll patch you up when you're hurt and cook you Dominican food when you're sad" },
      { question: "My love language is", answer: "Acts of service. I'll bring you soup when you're sick and help you study for your hardest exam" },
    ],
  },
  {
    first_name: "Grace", last_name: "Thompson", age: 20, gender: "Woman", gender_preference: "Men",
    height_inches: 65, major: "English", graduation_year: 2027, hometown: "Huntington, NY",
    residence_hall: "Cardozo Hall", ethnicity: "White/Caucasian", drinking: "Sometimes", smoking: "No",
    prompts: [
      { question: "I bet you can't", answer: "Recommend me a book I haven't already read. Seriously, try me. My Goodreads is unhinged" },
      { question: "We'll get along if", answer: "You appreciate a well-crafted sentence and aren't afraid to be vulnerable. Bonus points if you like indie music" },
      { question: "My most controversial opinion", answer: "The movie is sometimes better than the book. I said what I said" },
    ],
  },
  {
    first_name: "Alex", last_name: "Morales", age: 21, gender: "Man", gender_preference: "Everyone",
    height_inches: 68, major: "Art, Studio", graduation_year: 2026, hometown: "Astoria, NY",
    residence_hall: "Hand Hall", ethnicity: "Hispanic/Latino", drinking: "Yes", smoking: "Sometimes",
    prompts: [
      { question: "A life goal of mine", answer: "Have my art shown in a gallery before I'm 25. Currently manifesting and painting aggressively" },
      { question: "I go crazy for", answer: "Golden hour light. If you ever catch me staring at a wall, I'm probably just admiring how the shadows fall" },
      { question: "Together we could", answer: "Explore every thrift store on Long Island and find the most unhinged pieces of art to hang in our apartments" },
    ],
  },
  {
    first_name: "Sarah", last_name: "Ahmad", age: 20, gender: "Woman", gender_preference: "Men",
    height_inches: 64, major: "Biochemistry", graduation_year: 2027, hometown: "Dix Hills, NY",
    residence_hall: "Wagner Hall", ethnicity: "Middle Eastern", drinking: "No", smoking: "No",
    prompts: [
      { question: "I'm looking for", answer: "Someone who values growth — both personal and together. I want us to make each other better" },
      { question: "My simple pleasures", answer: "A perfectly organized planner, the smell of fresh coffee in the chemistry building, and FaceTiming my cat back home" },
      { question: "Green flags I look for", answer: "You remember small details from our conversations. That's how I know you actually listen" },
    ],
  },
  {
    first_name: "Chris", last_name: "Bailey", age: 22, gender: "Man", gender_preference: "Women",
    height_inches: 73, major: "Economics", graduation_year: 2026, hometown: "White Plains, NY",
    residence_hall: "West Apartments", ethnicity: "White/Caucasian", drinking: "Yes", smoking: "No",
    prompts: [
      { question: "Typical Sunday", answer: "Gym, meal prep, football on TV, and aggressively optimizing my fantasy lineup. I'm a simple man" },
      { question: "I'm convinced that", answer: "The best conversations happen after midnight. Something about the late hours makes people actually real" },
      { question: "The way to win me over is", answer: "Be passionate about something. I don't care if it's underwater basket weaving — if you love it, tell me everything" },
    ],
  },
  {
    first_name: "Mia", last_name: "Zhang", age: 19, gender: "Woman", gender_preference: "Everyone",
    height_inches: 63, major: "Music", graduation_year: 2028, hometown: "Flushing, NY",
    residence_hall: "Keller Hall", ethnicity: "East Asian", drinking: "Sometimes", smoking: "No",
    prompts: [
      { question: "I'm weirdly attracted to", answer: "People who can do something creative with their hands — play an instrument, draw, cook. Skilled hands are underrated" },
      { question: "My most irrational fear", answer: "Silence. Not the peaceful kind — the awkward kind. I'll fill it with a random fun fact, you're welcome" },
      { question: "Believe it or not, I", answer: "Got into Stony Brook for music performance and I've played violin since I was 4. Yes, the Asian stereotype, I know" },
    ],
  },
];

async function fetchAndUploadPhotos(
  admin: ReturnType<typeof getAdminClient>,
  userId: string,
  profileId: string,
  firstName: string,
  lastName: string,
  gender: string
): Promise<string[]> {
  const apiGender = gender === "Man" ? "male" : "female";
  const seed = `sbudate-${firstName.toLowerCase()}-${lastName.toLowerCase()}`;

  // Fetch a consistent face from randomuser.me
  const res = await fetch(`https://randomuser.me/api/?gender=${apiGender}&seed=${seed}`);
  const data = await res.json();
  const photoUrl = data.results?.[0]?.picture?.large;
  if (!photoUrl) return [];

  const imgRes = await fetch(photoUrl);
  const imgBuffer = Buffer.from(await imgRes.arrayBuffer());

  // Upload the same face 3 times to different paths
  const urls: string[] = [];
  for (let j = 0; j < 3; j++) {
    const path = `${userId}/${profileId}/${j}.jpg`;
    await admin.storage.from("photos").upload(path, imgBuffer, {
      contentType: "image/jpeg",
      upsert: true,
    });
    const { data: urlData } = admin.storage.from("photos").getPublicUrl(path);
    urls.push(urlData.publicUrl);
  }

  return urls;
}

export async function POST() {
  const user = await getAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = getAdminClient();
  const created: string[] = [];

  for (let i = 0; i < FAKE_PROFILES.length; i++) {
    const profile = FAKE_PROFILES[i];
    const fakeEmail = `fake-${profile.first_name.toLowerCase()}-${profile.last_name.toLowerCase()}@sbudate.fake`;

    // Check if already seeded
    const { data: existing } = await admin.from("profiles").select("id").eq("first_name", profile.first_name).eq("last_name", profile.last_name).eq("major", profile.major).limit(1);
    if (existing && existing.length > 0) {
      created.push(`${profile.first_name} (skipped — already exists)`);
      continue;
    }

    // Create a fake auth user
    const { data: authUser, error: authError } = await admin.auth.admin.createUser({
      email: fakeEmail,
      password: "fakepassword123!",
      email_confirm: true,
    });

    if (authError || !authUser.user) {
      created.push(`${profile.first_name} (auth error: ${authError?.message})`);
      continue;
    }

    // Insert profile
    const { data: newProfile, error: profileError } = await admin.from("profiles").insert({
      user_id: authUser.user.id,
      first_name: profile.first_name,
      last_name: profile.last_name,
      age: profile.age,
      gender: profile.gender,
      gender_preference: profile.gender_preference,
      height_inches: profile.height_inches,
      major: profile.major,
      graduation_year: profile.graduation_year,
      hometown: profile.hometown,
      residence_hall: profile.residence_hall,
      status: "approved",
    }).select().single();

    if (profileError || !newProfile) {
      created.push(`${profile.first_name} (profile error: ${profileError?.message})`);
      continue;
    }

    // Fetch face photo and upload to storage
    const photoUrls = await fetchAndUploadPhotos(
      admin, authUser.user.id, newProfile.id,
      profile.first_name, profile.last_name, profile.gender
    );
    if (photoUrls.length > 0) {
      await admin.from("photos").insert(
        photoUrls.map((url, pos) => ({
          profile_id: newProfile.id,
          url,
          position: pos,
          caption: null,
        }))
      );
    }

    // Insert prompts
    await admin.from("prompts").insert(
      profile.prompts.map((p, pos) => ({
        profile_id: newProfile.id,
        question: p.question,
        answer: p.answer,
        position: pos,
      }))
    );

    created.push(`${profile.first_name} ${profile.last_name} ✓`);
  }

  return NextResponse.json({ created });
}

// DELETE: Remove all fake profiles
export async function DELETE() {
  const user = await getAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = getAdminClient();
  const deleted: string[] = [];

  for (const profile of FAKE_PROFILES) {
    const fakeEmail = `fake-${profile.first_name.toLowerCase()}-${profile.last_name.toLowerCase()}@sbudate.fake`;

    // Find the auth user
    const { data: { users } } = await admin.auth.admin.listUsers();
    const fakeUser = users.find(u => u.email === fakeEmail);
    if (!fakeUser) continue;

    // Find profile
    const { data: existingProfile } = await admin.from("profiles").select("id").eq("user_id", fakeUser.id).single();
    if (existingProfile) {
      // Clean up related data
      await admin.from("messages").delete().eq("sender_id", existingProfile.id);
      await admin.from("likes").delete().or(`from_profile_id.eq.${existingProfile.id},to_profile_id.eq.${existingProfile.id}`);
      await admin.from("matches").delete().or(`profile1_id.eq.${existingProfile.id},profile2_id.eq.${existingProfile.id}`);
      await admin.from("skips").delete().or(`from_profile_id.eq.${existingProfile.id},to_profile_id.eq.${existingProfile.id}`);
      await admin.from("prompts").delete().eq("profile_id", existingProfile.id);
      await admin.from("photos").delete().eq("profile_id", existingProfile.id);
      await admin.from("reports").delete().eq("reported_profile_id", existingProfile.id);
      // Clean up storage photos
      const { data: storageFiles } = await admin.storage.from("photos").list(`${fakeUser.id}/${existingProfile.id}`);
      if (storageFiles?.length) {
        await admin.storage.from("photos").remove(
          storageFiles.map(f => `${fakeUser.id}/${existingProfile.id}/${f.name}`)
        );
      }
      await admin.from("profiles").delete().eq("id", existingProfile.id);
    }

    // Delete auth user
    await admin.auth.admin.deleteUser(fakeUser.id);
    deleted.push(`${profile.first_name} ${profile.last_name}`);
  }

  return NextResponse.json({ deleted });
}
