import illustration from '@/assets/images/illustration.png';
import google from "@/assets/icons/google.png";
import person from "@/assets/icons/person.png";
import email from "@/assets/icons/email.png";
import lock from "@/assets/icons/lock.png";
import signUpCar from "@/assets/images/signup-car.png";
import check from "@/assets/images/check.png";

export const IMAGES = {
    illustration,
    signUpCar,
    check
};

export const icons = {
    google,
    person,
    email,
    lock
}

export const onboarding = [
    {
      id: 1,
      title: "The perfect ride is just a tap away!",
      description:
        "Your journey begins with Ryde. Find your ideal ride effortlessly.",
      image: IMAGES.check,
    },
    {
      id: 2,
      title: "Best car in your hands with Ryde",
      description:
        "Discover the convenience of finding your perfect ride with Ryde",
      image: IMAGES.check,
    },
    {
      id: 3,
      title: "Your ride, your way. Let's go!",
      description:
        "Enter your destination, sit back, and let us take care of the rest.",
      image: IMAGES.check,
    },
  ];